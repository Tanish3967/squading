
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, phone)
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own contacts"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Service role full access to contacts"
  ON public.contacts FOR ALL
  TO authenticated
  USING (auth.role() = 'service_role'::text);
