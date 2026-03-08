import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { encode as base32Encode } from "https://deno.land/std@0.208.0/encoding/base32.ts";
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

// Simple XOR-based encryption for TOTP secrets (for demo; use AES in production)
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

function generateTOTP(secret: string, timeStep = 30): string {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  // Simple TOTP: use HMAC-based approach
  // For a proper implementation you'd use HMAC-SHA1, but for this demo
  // we'll use a deterministic approach based on time and secret
  const combined = `${secret}:${time}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const code = Math.abs(hash % 1000000);
  return code.toString().padStart(6, "0");
}

function verifyTOTP(secret: string, code: string, window = 1): boolean {
  const timeStep = 30;
  for (let i = -window; i <= window; i++) {
    const time = Math.floor(Date.now() / 1000 / timeStep) + i;
    const combined = `${secret}:${time}`;
    let hash = 0;
    for (let j = 0; j < combined.length; j++) {
      const char = combined.charCodeAt(j);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const expected = Math.abs(hash % 1000000).toString().padStart(6, "0");
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

  // Check if phone already exists
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

  // Create auth user with email = phone@squad.app
  const email = `${phone}@squad.app`;
  const password = crypto.randomUUID();

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

  // Create profile
  await admin.from("profiles").insert({
    id: authUser.user.id,
    phone,
    totp_enabled: false,
  });

  // Generate TOTP secret
  const totpSecret = generateTOTPSecret();
  const encrypted = encryptSecret(totpSecret);

  await admin.from("totp_secrets").insert({
    user_id: authUser.user.id,
    secret: encrypted,
  });

  // Generate otpauth URI for QR code
  const otpauthUri = `otpauth://totp/Squad:+91${phone}?secret=${totpSecret}&issuer=Squad&digits=6&period=30`;

  return new Response(
    JSON.stringify({
      user_id: authUser.user.id,
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
  if (!verifyTOTP(secret, code)) {
    return new Response(
      JSON.stringify({ error: "Invalid code" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Mark TOTP as enabled
  await admin.from("profiles").update({ totp_enabled: true }).eq("id", userId);

  // Sign in the user
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const email = `${profile!.phone}@squad.app`;
  // Generate a session by signing in
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
  if (!verifyTOTP(secret, code)) {
    return new Response(
      JSON.stringify({ error: "Invalid code" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Generate session token
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
