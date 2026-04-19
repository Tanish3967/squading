import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { authenticator } from "npm:otplib@12.0.1";

// Allow ±1 time period (90s total window) to handle clock drift and setup delays
authenticator.options = { window: 1 };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const encryptionKey = Deno.env.get("TOTP_ENCRYPTION_KEY")!;

// Module-scope admin client — reused across warm invocations
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Hardcoded bypass phones — skip TOTP, auto-create if needed
const BYPASS_PHONES = new Set([
  "8630006991",
  "9660571700",
  "9162349274",
  "9798021507",
  "9004573847",
]);

// Best-effort waitUntil — falls back to fire-and-forget if EdgeRuntime missing
function defer(p: Promise<unknown>) {
  // @ts-ignore EdgeRuntime is available in Supabase Edge runtime
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(p);
  } else {
    p.catch(() => {});
  }
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

// ── shared: generate & store TOTP secret, return setup payload ────────
async function setupTOTPForUser(userId: string, phone: string) {
  const totpSecret = authenticator.generateSecret();
  const encrypted = encryptSecret(totpSecret);

  await admin.from("totp_secrets").upsert({
    user_id: userId,
    secret: encrypted,
  }, { onConflict: "user_id" });

  const otpauthUri = authenticator.keyuri(`+91${phone}`, "Squad", totpSecret);

  return {
    user_id: userId,
    totp_secret: totpSecret,
    otpauth_uri: otpauthUri,
    manual_key: totpSecret,
  };
}

// ── ensure auth user + profile exist; returns user_id ────────────────
async function ensureUserExists(phone: string): Promise<string | null> {
  const email = `${phone}@squad.app`;
  const password = crypto.randomUUID();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { phone },
  });

  if (authError) {
    if (authError.message?.includes("already been registered")) {
      const { data: users } = await admin.auth.admin.listUsers({ filter: email });
      const existingUser = users?.users?.[0];
      if (existingUser) {
        await admin.from("profiles").upsert({
          id: existingUser.id, phone, totp_enabled: false,
        }, { onConflict: "id" });
        return existingUser.id;
      }
    }
    return null;
  }

  const userId = authUser.user.id;
  await admin.from("profiles").upsert({
    id: userId, phone, totp_enabled: false,
  });
  return userId;
}

// ── check-phone (combined: returns TOTP setup data inline when needed) ──
async function handleCheckPhone(phone: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, totp_enabled")
    .eq("phone", phone)
    .maybeSingle();

  // Bypass phones: report ready immediately, do writes in background
  if (BYPASS_PHONES.has(phone)) {
    if (!profile) {
      defer((async () => {
        const email = `${phone}@squad.app`;
        const password = crypto.randomUUID();
        const { data: authUser } = await admin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { phone },
        });
        if (authUser?.user) {
          await admin.from("profiles").upsert({ id: authUser.user.id, phone, totp_enabled: true });
        }
      })());
    } else if (!profile.totp_enabled) {
      defer(admin.from("profiles").update({ totp_enabled: true }).eq("id", profile.id).then(() => {}));
    }
    return json({ exists: true, totp_enabled: true });
  }

  // Existing user with TOTP set up — fast path
  if (profile && profile.totp_enabled) {
    return json({ exists: true, totp_enabled: true });
  }

  // Existing user without TOTP — re-setup inline
  if (profile && !profile.totp_enabled) {
    await admin.from("totp_secrets").delete().eq("user_id", profile.id);
    const setup = await setupTOTPForUser(profile.id, phone);
    return json({ exists: true, totp_enabled: false, ...setup });
  }

  // New user — create + setup inline
  const userId = await ensureUserExists(phone);
  if (!userId) {
    return json({ error: "Failed to register user" }, 500);
  }
  const setup = await setupTOTPForUser(userId, phone);
  return json({ exists: false, totp_enabled: false, ...setup });
}

// ── verify-setup (first time code entry) ────────────────────
async function handleVerifySetup(userId: string, code: string) {
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
  const { data: profile } = await admin
    .from("profiles")
    .select("id, phone, name, avatar_url, totp_enabled")
    .eq("phone", phone)
    .single();

  if (!profile) {
    return json({ error: "Phone number not found" }, 404);
  }

  // Bypass TOTP for hardcoded test phones
  if (!BYPASS_PHONES.has(phone)) {
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

    // Lightweight warm-up ping — no DB, no body parsing
    if (path === "ping") {
      return json({ ok: true });
    }

    const body = req.method === "POST" ? await req.json() : {};

    switch (path) {
      case "check-phone":
        return await handleCheckPhone(body.phone);
      // Legacy routes — kept for backwards compatibility but check-phone now returns setup inline
      case "register":
      case "resetup":
        return await handleCheckPhone(body.phone);
      case "verify-setup":
        return await handleVerifySetup(body.user_id, body.code);
      case "login":
        return await handleLogin(body.phone, body.code);
      default:
        return json({ error: "Not found" }, 404);
    }
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
