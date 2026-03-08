
-- Index on profiles.phone for fast lookup during login
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles (phone);

-- Index on totp_secrets.user_id for fast join after phone lookup
CREATE INDEX IF NOT EXISTS idx_totp_secrets_user_id ON public.totp_secrets (user_id);
