-- ============================================================================
-- DIAGNOSTIC QUERIES FOR CARDINALITY VIOLATION (21000) AND PERMISSION (42501)
-- Run these in Supabase SQL Editor if errors persist after applying fixes
-- ============================================================================

-- ============================================================================
-- QUERY 1: Identify ALL triggers on settings table
-- This will show any triggers that might be causing recursive writes
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  condition
FROM information_schema.triggers
WHERE event_object_table = 'settings'
ORDER BY trigger_name;

-- ============================================================================
-- QUERY 2: Check for duplicate keys in settings table
-- Cardinality violations occur when UNIQUE constraint is violated
-- ============================================================================
SELECT 
  key,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::TEXT, ', ') as duplicate_ids
FROM settings
GROUP BY key
HAVING COUNT(*) > 1;

-- ============================================================================
-- QUERY 3: Identify foreign keys that reference settings table
-- Foreign key cascades can cause secondary write attempts
-- ============================================================================
SELECT
  tc.table_name AS source_table,
  kcu.column_name AS source_column,
  ccu.table_name AS target_table,
  ccu.column_name AS target_column,
  tc.constraint_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'settings';

-- ============================================================================
-- QUERY 4: Check RLS policies that might block operations
-- Permission denied (42501) occurs when RLS blocks the operation
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'settings'
ORDER BY policyname;

-- ============================================================================
-- QUERY 5: Check if update_all_product_prices RPC writes to settings
-- This RPC might be causing recursive updates to settings table
-- ============================================================================
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_all_product_prices'
  AND routine_schema = 'public';

-- ============================================================================
-- QUERY 6: Check for any functions that reference settings table
-- Functions can implicitly write to settings causing cardinality violations
-- ============================================================================
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%settings%'
  AND n.nspname = 'public';

-- ============================================================================
-- QUERY 7: Check current locks on settings table
-- Locks can cause operations to fail or deadlock
-- ============================================================================
SELECT
  t.relname AS table_name,
  l.locktype,
  l.mode,
  l.granted,
  a.query,
  a.pid,
  a.application_name,
  a.client_addr
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
JOIN pg_class t ON l.relation = t.oid
WHERE t.relname = 'settings';

-- ============================================================================
-- QUERY 8: Verify unique constraint exists and is valid
-- ============================================================================
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition,
  convalidated AS is_validated
FROM pg_constraint
WHERE conrelid = 'settings'::regclass
  AND contype = 'u';

-- ============================================================================
-- QUERY 9: Check for any materialized views that reference settings
-- Materialized view refreshes can cause write operations
-- ============================================================================
SELECT
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE definition ILIKE '%settings%';

-- ============================================================================
-- QUERY 10: Audit recent failed operations on settings
-- Check pg_stat_statements if enabled (requires extension)
-- ============================================================================
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query ILIKE '%settings%'
  AND query ILIKE '%insert% OR query ILIKE %update%'
ORDER BY total_time DESC
LIMIT 10;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================

-- If QUERY 1 returns triggers:
--   -> Those triggers are likely causing recursive writes
--   -> Run fix_settings_integrity.sql to drop them

-- If QUERY 2 returns duplicates:
--   -> Run the duplicate cleanup in fix_settings_integrity.sql
--   -> The unique constraint is being violated

-- If QUERY 3 returns foreign keys:
--   -> Check if update_rule or delete_rule is CASCADE
--   -> CASCADE operations can cause secondary writes

-- If QUERY 4 shows restrictive policies:
--   -> Ensure your user role has appropriate permissions
--   -> Run fix_settings_integrity.sql to reset policies

-- If QUERY 5 shows RPC writes to settings:
--   -> This is a recursive update loop
--   -> Modify the RPC to not write to settings

-- If QUERY 6 shows functions writing to settings:
--   -> Those functions are causing secondary writes
--   -> Refactor them to avoid writing to settings

-- If QUERY 7 shows locks:
--   -> Kill the blocking PID: SELECT pg_terminate_backend(pid)
--   -> Or wait for the lock to be released

-- If QUERY 8 shows constraint not validated:
--   -> The constraint exists but isn't enforced
--   -> Run: ALTER TABLE settings VALIDATE CONSTRAINT settings_key_key
