CREATE POLICY "Creators can delete their activities" ON public.activities FOR DELETE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Activity creators can delete invitees" ON public.invitees FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM activities WHERE activities.id = invitees.activity_id AND activities.creator_id = auth.uid()));