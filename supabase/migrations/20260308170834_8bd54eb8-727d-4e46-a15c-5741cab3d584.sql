
-- totp_secrets should never be accessed by regular users (only service_role via edge functions)
CREATE POLICY "Deny all access to totp_secrets"
  ON public.totp_secrets FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
