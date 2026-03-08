
-- 1. Fix invitees SELECT — restrict to own records or activity creator
DROP POLICY IF EXISTS "Users can view invitees" ON public.invitees;
CREATE POLICY "Users can view relevant invitees"
  ON public.invitees FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM activities WHERE activities.id = invitees.activity_id AND activities.creator_id = auth.uid())
  );

-- 2. Remove unnecessary "Service role full access" policies (service_role bypasses RLS automatically)
DROP POLICY IF EXISTS "Service role full access to activities" ON public.activities;
DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access to transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role full access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role full access to push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service role full access to invitees" ON public.invitees;
DROP POLICY IF EXISTS "Service role full access to totp_secrets" ON public.totp_secrets;
DROP POLICY IF EXISTS "Service role full access to app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Service role full access to contacts" ON public.contacts;
DROP POLICY IF EXISTS "Service role full access to comments" ON public.comments;
DROP POLICY IF EXISTS "Service role full access to waitlist" ON public.waitlist;
