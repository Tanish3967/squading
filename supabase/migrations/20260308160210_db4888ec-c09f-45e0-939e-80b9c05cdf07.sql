-- Lower the minimum deposit to ₹1 (from ₹99)
ALTER TABLE public.activities DROP CONSTRAINT activities_deposit_check;
ALTER TABLE public.activities ADD CONSTRAINT activities_deposit_check CHECK (deposit >= 1 AND deposit <= 9999);