-- Fix: Disable RLS on Phase 1 tables for development
-- In Phase 3 we'll re-enable RLS with proper policies for multi-user access

-- Disable RLS on global_companies (everyone should be able to read monitored companies)
ALTER TABLE global_companies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on signals (in Phase 3 we'll add user filtering via RLS)
ALTER TABLE signals DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('global_companies', 'signals');
