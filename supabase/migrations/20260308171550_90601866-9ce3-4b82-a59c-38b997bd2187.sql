
-- Move extensions out of public schema to a dedicated 'extensions' schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move common extensions (if they exist in public) to extensions schema
DO $$
BEGIN
  -- Check and move uuid-ossp if in public
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp' AND extnamespace = 'public'::regnamespace) THEN
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
  END IF;
  
  -- Check and move pgcrypto if in public
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto' AND extnamespace = 'public'::regnamespace) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END $$;
