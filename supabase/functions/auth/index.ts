import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { authenticator } from "npm:otplib@12.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const encryptionKey = Deno.env.get("TOTP_ENCRYPTION_KEY")!;

// Hardcoded bypass phones — skip TOTP, auto-create if needed
const BYPASS_PHONES = new Set([
  "8630006991",
  "9660571700",
  "9162349274",
  "9798021507",
  "9004573847",
]);

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function encryptSecret(secret: string): string {
  const keyBytes = new TextEncoder().encode(encryptionKey);
  const secretBytes = new TextEncoder().encode(secret);
  const encrypted = new Uint8Array(secretBytes.length);
  for (let i = 0; i < secretBytes.length; i++) {
    encrypted[i] = secretBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...encrypted));
}

function decryptSecret(encryptedBase64: string): string {
  const keyBytes = new TextEncoder().encode(encryptionKey);
  const encrypted = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }
  return new TextDecoder().decode(decrypted);
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── check-phone ──────────────────────────────────────────────
async function handleCheckPhone(phone: string) {
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, totp_enabled")
    .eq("phone", phone)
    .maybeSingle();

  // Bypass phones: auto-create profile+auth if missing, report as totp_enabled
  if (BYPASS_PHONES.has(phone)) {
    if (!profile) {
      // Auto-create auth user + profile
      const email = `${phone}@squad.app`;
      const password = crypto.randomUUID();
      const { data: authUser } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { phone },
      });
      if (authUser?.user) {
        await admin.from("profiles").upsert({ id: authUser.user.id, phone, totp_enabled: true });
      }
    } else if (!profile.totp_enabled) {
      await admin.from("profiles").update({ totp_enabled: true }).eq("id", profile.id);
    }
    return json({ exists: true, totp_enabled: true });
  }

  return json({
    exists: !!profile,
    totp_enabled: profile?.totp_enabled ?? false,
  });
}

  if (existing) {
    return json({ error: "Phone number already registered" }, 400);
  }

  const email = `${phone}@squad.app`;
  const password = crypto.randomUUID();

  // Create auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { phone },
  });

  if (authError) {
    // If user already exists in auth (orphaned), reuse them
    if (authError.message?.includes("already been registered")) {
      const { data: users } = await admin.auth.admin.listUsers({ filter: email });
      const existingUser = users?.users?.[0];
      if (existingUser) {
        return await setupTOTPForUser(admin, existingUser.id, phone);
      }
    }
    return json({ error: authError.message }, 400);
  }

  const userId = authUser.user.id;

  // Create profile
  await admin.from("profiles").upsert({
    id: userId,
    phone,
    totp_enabled: false,
  });

  return await setupTOTPForUser(admin, userId, phone);
}

// ── re-setup TOTP for existing user who hasn't completed setup ──
async function handleResetup(phone: string) {
  const admin = getAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .single();

  if (!profile) {
    return json({ error: "Phone number not found" }, 404);
  }

  // Delete old TOTP secret and re-generate
  await admin.from("totp_secrets").delete().eq("user_id", profile.id);

  return await setupTOTPForUser(admin, profile.id, phone);
}

// ── shared: generate & store TOTP secret ────────────────────
async function setupTOTPForUser(admin: ReturnType<typeof getAdminClient>, userId: string, phone: string) {
  const totpSecret = authenticator.generateSecret();
  const encrypted = encryptSecret(totpSecret);

  await admin.from("totp_secrets").upsert({
    user_id: userId,
    secret: encrypted,
  }, { onConflict: "user_id" });

  const otpauthUri = authenticator.keyuri(`+91${phone}`, "Squad", totpSecret);

  return json({
    user_id: userId,
    totp_secret: totpSecret,
    otpauth_uri: otpauthUri,
    manual_key: totpSecret,
  });
}

// ── verify-setup (first time code entry) ────────────────────
async function handleVerifySetup(userId: string, code: string) {
  const admin = getAdminClient();

  const { data: totpData } = await admin
    .from("totp_secrets")
    .select("secret")
    .eq("user_id", userId)
    .single();

  if (!totpData) {
    return json({ error: "TOTP not set up" }, 400);
  }

  const secret = decryptSecret(totpData.secret);
  const valid = authenticator.check(code, secret);
  if (!valid) {
    return json({ error: "Invalid code" }, 401);
  }

  await admin.from("profiles").update({ totp_enabled: true }).eq("id", userId);

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const email = `${profile!.phone}@squad.app`;
  const { data: session, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) {
    return json({ error: "Failed to create session" }, 500);
  }

  return json({ success: true, profile, token_hash: session.properties?.hashed_token });
}

// ── login (returning user) ──────────────────────────────────
async function handleLogin(phone: string, code: string) {
  const admin = getAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, phone, name, avatar_url, totp_enabled")
    .eq("phone", phone)
    .single();

  if (!profile) {
    return json({ error: "Phone number not found" }, 404);
  }

  const { data: totpData } = await admin
    .from("totp_secrets")
    .select("secret")
    .eq("user_id", profile.id)
    .single();

  if (!totpData) {
    return json({ error: "TOTP not configured" }, 400);
  }

  const secret = decryptSecret(totpData.secret);
  const valid = authenticator.check(code, secret);
  if (!valid) {
    return json({ error: "Invalid code" }, 401);
  }

  const email = `${phone}@squad.app`;
  const { data: session, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) {
    return json({ error: "Failed to create session" }, 500);
  }

  return json({ success: true, profile, token_hash: session.properties?.hashed_token });
}

// ── Router ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    const body = req.method === "POST" ? await req.json() : {};

    switch (path) {
      case "check-phone":
        return await handleCheckPhone(body.phone);
      case "register":
        return await handleRegister(body.phone);
      case "resetup":
        return await handleResetup(body.phone);
      case "verify-setup":
        return await handleVerifySetup(body.user_id, body.code);
      case "login":
        return await handleLogin(body.phone, body.code);
      default:
        return json({ error: "Not found" }, 404);
    }
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
