
CREATE OR REPLACE FUNCTION public.get_profiles_by_phones(phone_numbers text[])
RETURNS TABLE(id uuid, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.phone
  FROM public.profiles p
  WHERE p.phone = ANY(phone_numbers);
$$;
