-- Function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Service role full access to profiles" ON public.profiles FOR ALL USING (auth.role() = 'service_role');
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TOTP SECRETS
CREATE TABLE public.totp_secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  secret TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to totp_secrets" ON public.totp_secrets FOR ALL USING (auth.role() = 'service_role');

-- ACTIVITIES
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('trek','sports','party','food','movie','travel','other')),
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  time TEXT NOT NULL DEFAULT '00:00',
  location TEXT NOT NULL,
  deposit INTEGER NOT NULL CHECK (deposit >= 4900 AND deposit <= 99900),
  max_people INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  creator_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their activities" ON public.activities FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Service role full access to activities" ON public.activities FOR ALL USING (auth.role() = 'service_role');
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- INVITEES
CREATE TABLE public.invitees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  attended BOOLEAN NOT NULL DEFAULT FALSE,
  marked_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(activity_id, user_id)
);
ALTER TABLE public.invitees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invitees" ON public.invitees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activity creators can insert invitees" ON public.invitees FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.activities WHERE id = activity_id AND creator_id = auth.uid()));
CREATE POLICY "Invitees can update their own invite" ON public.invitees FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Creators can update invitees for their activities" ON public.invitees FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.activities WHERE id = activity_id AND creator_id = auth.uid()));
CREATE POLICY "Service role full access to invitees" ON public.invitees FOR ALL USING (auth.role() = 'service_role');

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  activity_id UUID REFERENCES public.activities(id) NOT NULL,
  invitee_id UUID REFERENCES public.invitees(id) UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit','refund')),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','initiated','success','failed','refund_initiated','refunded')),
  phonepe_merchant_txn_id TEXT UNIQUE,
  phonepe_payment_id TEXT UNIQUE,
  phonepe_order_id TEXT,
  refund_id TEXT UNIQUE,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service role full access to transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service role full access to notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role');

-- INDEXES
CREATE INDEX idx_activities_creator ON public.activities(creator_id);
CREATE INDEX idx_activities_status ON public.activities(status);
CREATE INDEX idx_invitees_activity ON public.invitees(activity_id);
CREATE INDEX idx_invitees_user ON public.invitees(user_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;