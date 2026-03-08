ALTER TABLE public.activities DROP CONSTRAINT activities_deposit_check;
ALTER TABLE public.activities ADD CONSTRAINT activities_deposit_check CHECK (deposit >= 99 AND deposit <= 999);