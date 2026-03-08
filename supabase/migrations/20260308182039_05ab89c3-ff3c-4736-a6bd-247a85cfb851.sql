
-- Create a function that inserts a notification when an invitee is added
CREATE OR REPLACE FUNCTION public.notify_on_invitee_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  activity_title TEXT;
  creator_name TEXT;
  creator_id UUID;
BEGIN
  -- Don't notify if the user invited themselves (self-join)
  SELECT a.title, a.creator_id INTO activity_title, creator_id
  FROM public.activities a
  WHERE a.id = NEW.activity_id;

  -- Only notify if the invitee is not the creator (creator inviting someone else)
  IF creator_id IS DISTINCT FROM NEW.user_id THEN
    SELECT COALESCE(p.name, 'Someone') INTO creator_name
    FROM public.profiles p
    WHERE p.id = creator_id;

    INSERT INTO public.notifications (user_id, activity_id, type, title, body)
    VALUES (
      NEW.user_id,
      NEW.activity_id,
      'invite',
      'You''ve been invited!',
      creator_name || ' invited you to "' || activity_title || '". Tap to respond.'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on invitees table
CREATE TRIGGER trg_notify_on_invitee_insert
  AFTER INSERT ON public.invitees
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_invitee_insert();
