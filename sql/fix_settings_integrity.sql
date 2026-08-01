-- ============================================================================
-- FIX SETTINGS TABLE INTEGRITY
-- Run this in Supabase SQL Editor to fix Cardinality Violation and Permission errors
-- ============================================================================

-- STEP 1: Drop ALL triggers on settings table (prevents recursive writes)
DROP TRIGGER IF EXISTS settings_updated_at_trigger ON settings;
DROP TRIGGER IF EXISTS settings_created_at_trigger ON settings;
DROP TRIGGER IF EXISTS settings_audit_trigger ON settings;
DROP TRIGGER IF EXISTS settings_sync_trigger ON settings;
DROP TRIGGER IF EXISTS ON settings;

-- STEP 2: Ensure RLS is properly configured
-- First, disable RLS temporarily to reset policies
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;
DROP POLICY IF EXISTS "Allow service role to manage settings" ON settings;

-- Re-enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Policy 1: Authenticated users can read
CREATE POLICY "Allow authenticated read"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Authenticated users can insert
CREATE POLICY "Allow authenticated insert"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Authenticated users can update
CREATE POLICY "Allow authenticated update"
  ON settings FOR UPDATE
  TO authenticated
  USING (true);

-- Policy 4: Service role has full access (bypasses RLS)
CREATE POLICY "Service role full access"
  ON settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- STEP 3: Remove any duplicate keys that may exist
DELETE FROM settings 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM settings 
  GROUP BY key
);

-- STEP 4: Verify the unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'settings_key_key'
  ) THEN
    ALTER TABLE settings ADD CONSTRAINT settings_key_key UNIQUE (key);
  END IF;
END $$;

-- STEP 5: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO authenticated;
GRANT ALL PRIVILEGES ON settings TO service_role;

-- STEP 6: Verify no foreign keys reference settings (could cause cascading writes)
DO $$
DECLARE
  fk_record RECORD;
BEGIN
  FOR fk_record IN 
    SELECT 
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'settings'
  LOOP
    RAISE NOTICE 'Foreign key found: %.% references %.%', 
      fk_record.table_name, 
      fk_record.column_name, 
      fk_record.foreign_table_name, 
      fk_record.foreign_column_name;
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (run these after the script to verify)
-- ============================================================================

-- Check for any remaining triggers
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'settings';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'settings';

-- Check for duplicates
-- SELECT key, COUNT(*) as count 
-- FROM settings 
-- GROUP BY key 
-- HAVING COUNT(*) > 1;
