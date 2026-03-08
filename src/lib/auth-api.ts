import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

async function callAuth(action: string, body: Record<string, string>) {
  const { data, error } = await supabase.functions.invoke(`auth/${action}`, {
    body,
  });
  if (error) throw new Error(error.message || "Auth request failed");
  return data;
}

export async function checkPhone(phone: string) {
  return callAuth("check-phone", { phone });
}

export async function registerPhone(phone: string) {
  return callAuth("register", { phone });
}

export async function verifySetup(userId: string, code: string) {
  const data = await callAuth("verify-setup", { user_id: userId, code });
  if (data.token_hash) {
    // Verify the OTP token to create a session
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
