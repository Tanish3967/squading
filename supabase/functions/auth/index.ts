import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { encode as base32Encode, decode as base32Decode } from "https://deno.land/std@0.208.0/encoding/base32.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const encryptionKey = Deno.env.get("TOTP_ENCRYPTION_KEY")!;

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

function generateTOTPSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(bytes);
}

// Convert a number to an 8-byte big-endian buffer
function intToBytes(num: number): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return bytes;
}

// RFC 6238 TOTP using HMAC-SHA1
async function generateTOTP(secret: string, timeStep = 30, time?: number): Promise<string> {
  const counter = time ?? Math.floor(Date.now() / 1000 / timeStep);
  const counterBytes = intToBytes(counter);

  // Decode base32 secret to raw bytes
  const keyBytes = base32Decode(secret);

  // Import key for HMAC-SHA1
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  // Sign the counter with HMAC-SHA1
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, counterBytes);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

async function verifyTOTP(secret: string, code: string, window = 1): Promise<boolean> {
  const timeStep = 30;
  const currentCounter = Math.floor(Date.now() / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const expected = await generateTOTP(secret, timeStep, currentCounter + i);
    if (expected === code) return true;
  }
  return false;
}

async function handleCheckPhone(phone: string) {
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, totp_enabled")
    .eq("phone", phone)
    .maybeSingle();

  return new Response(
    JSON.stringify({
      exists: !!profile,
      totp_enabled: profile?.totp_enabled ?? false,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleRegister(phone: string) {
  const admin = getAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    return new Response(
      JSON.stringify({ error: "Phone number already registered" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const email = `${phone}@squad.app`;
  const password = crypto.randomUUID();

  // Check if auth user already exists (orphaned from deleted profile)
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingAuthUser = existingUsers?.users?.find((u: any) => u.email === email);
  
  let userId: string;

  if (existingAuthUser) {
    // Reuse existing auth user — delete old TOTP secret if any
    userId = existingAuthUser.id;
    await admin.from("totp_secrets").delete().eq("user_id", userId);
  } else {
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    userId = authUser.user.id;
  }

  await admin.from("profiles").insert({
    id: userId,
    phone,
    totp_enabled: false,
  });

  const totpSecret = generateTOTPSecret();
  const encrypted = encryptSecret(totpSecret);

  await admin.from("totp_secrets").insert({
    user_id: userId,
    secret: encrypted,
  });

  const otpauthUri = `otpauth://totp/Squad:+91${phone}?secret=${totpSecret}&issuer=Squad&digits=6&period=30`;

  return new Response(
    JSON.stringify({
      user_id: userId,
      totp_secret: totpSecret,
      otpauth_uri: otpauthUri,
      manual_key: totpSecret,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleVerifySetup(userId: string, code: string) {
  const admin = getAdminClient();

  const { data: totpData } = await admin
    .from("totp_secrets")
    .select("secret")
    .eq("user_id", userId)
    .single();

  if (!totpData) {
    return new Response(
      JSON.stringify({ error: "TOTP not set up" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const secret = decryptSecret(totpData.secret);
  const valid = await verifyTOTP(secret, code);
  if (!valid) {
    return new Response(
      JSON.stringify({ error: "Invalid code" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
    return new Response(
      JSON.stringify({ error: "Failed to create session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, profile, token_hash: session.properties?.hashed_token }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleLogin(phone: string, code: string) {
  const admin = getAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, phone, name, avatar_url, totp_enabled")
    .eq("phone", phone)
    .single();

  if (!profile) {
    return new Response(
      JSON.stringify({ error: "Phone number not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: totpData } = await admin
    .from("totp_secrets")
    .select("secret")
    .eq("user_id", profile.id)
    .single();

  if (!totpData) {
    return new Response(
      JSON.stringify({ error: "TOTP not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const secret = decryptSecret(totpData.secret);
  const valid = await verifyTOTP(secret, code);
  if (!valid) {
    return new Response(
      JSON.stringify({ error: "Invalid code" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const email = `${phone}@squad.app`;
  const { data: session, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      profile,
      token_hash: session.properties?.hashed_token,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

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
      case "verify-setup":
        return await handleVerifySetup(body.user_id, body.code);
      case "login":
        return await handleLogin(body.phone, body.code);
      default:
        return new Response(
          JSON.stringify({ error: "Not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
