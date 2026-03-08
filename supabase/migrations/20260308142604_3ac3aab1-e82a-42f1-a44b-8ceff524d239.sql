-- Comments table for activity chat
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view comments for activities they can see
CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to comments"
  ON public.comments FOR ALL TO service_role
  USING (true);

-- Waitlist table
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'waiting',
  UNIQUE(activity_id, user_id)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view waitlist"
  ON public.waitlist FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can join waitlist"
  ON public.waitlist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave waitlist"
  ON public.waitlist FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Activity creators can manage waitlist"
  ON public.waitlist FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.activities
    WHERE activities.id = waitlist.activity_id
    AND activities.creator_id = auth.uid()
  ));

CREATE POLICY "Service role full access to waitlist"
  ON public.waitlist FOR ALL TO service_role
  USING (true);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;