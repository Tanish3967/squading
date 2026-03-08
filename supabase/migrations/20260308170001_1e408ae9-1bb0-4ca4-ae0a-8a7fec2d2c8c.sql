
-- 1. Create a security definer function to get public profile info (no phone)
CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids uuid[])
RETURNS TABLE(id uuid, name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(user_ids);
$$;

-- 2. Restrict profiles SELECT to own row only (phone protected)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 3. Fix invitees - add trigger to prevent fraud on paid/attended
CREATE OR REPLACE FUNCTION public.prevent_invitee_fraud()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- If the updater is the invitee (not the activity creator), block paid/attended changes
  IF auth.uid() = NEW.user_id AND NOT EXISTS (
    SELECT 1 FROM activities WHERE id = NEW.activity_id AND creator_id = auth.uid()
  ) THEN
    NEW.paid := OLD.paid;
    NEW.attended := OLD.attended;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invitee_fraud_prevention
  BEFORE UPDATE ON public.invitees
  FOR EACH ROW EXECUTE FUNCTION public.prevent_invitee_fraud();

-- 4. Tighten waitlist SELECT
DROP POLICY IF EXISTS "Authenticated users can view waitlist" ON public.waitlist;
CREATE POLICY "Users can view relevant waitlist entries"
  ON public.waitlist FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM activities WHERE activities.id = waitlist.activity_id AND activities.creator_id = auth.uid())
  );
