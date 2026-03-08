CREATE POLICY "Users can insert themselves as invitees"
ON public.invitees
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);