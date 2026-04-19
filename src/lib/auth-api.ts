import { supabase } from "@/integrations/supabase/client";

async function callAuth(action: string, body: Record<string, string>) {
  const { data, error } = await supabase.functions.invoke(`auth/${action}`, {
    body,
  });
  if (error) throw new Error(error.message || "Auth request failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

export interface CheckPhoneResult {
  exists: boolean;
  totp_enabled: boolean;
  // Present when user is new or hasn't completed TOTP setup
  user_id?: string;
  totp_secret?: string;
  otpauth_uri?: string;
  manual_key?: string;
}

export async function checkPhone(phone: string): Promise<CheckPhoneResult> {
  return callAuth("check-phone", { phone });
}

// Fire-and-forget warm-up — call on phone-input focus to pay cold-boot cost early
let pingedThisSession = false;
export function pingAuth() {
  if (pingedThisSession) return;
  pingedThisSession = true;
  supabase.functions.invoke("auth/ping", { method: "GET" } as any).catch(() => {
    pingedThisSession = false; // allow retry on next focus
  });
}

// Kept for backwards compatibility; check-phone now returns this data inline.
export async function registerPhone(phone: string) {
  return callAuth("register", { phone });
}

export async function resetupTOTP(phone: string) {
  return callAuth("resetup", { phone });
}

export async function verifySetup(userId: string, code: string) {
  const data = await callAuth("verify-setup", { user_id: userId, code });
  if (data.token_hash) {
    await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: "magiclink",
    });
  }
  return data;
}

export async function loginWithTOTP(phone: string, code: string) {
  const data = await callAuth("login", { phone, code });
  if (data.token_hash) {
    await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: "magiclink",
    });
  }
  return data;
}
