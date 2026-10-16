-- Fix: Rename 'companies' table to 'global_companies'
-- This ensures consistency with the codebase and future user_companies table

-- Check if old 'companies' table exists and 'global_companies' doesn't
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'companies')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'global_companies')
  THEN
    ALTER TABLE companies RENAME TO global_companies;
    RAISE NOTICE 'Renamed companies to global_companies';
  END IF;
END $$;

-- Recreate the index with correct table name
DROP INDEX IF EXISTS idx_companies_active;
CREATE INDEX IF NOT EXISTS idx_global_companies_active
  ON global_companies (is_active)
  WHERE is_active = true;
