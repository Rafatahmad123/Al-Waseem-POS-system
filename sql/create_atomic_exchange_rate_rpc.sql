-- ============================================================================
-- ATOMIC EXCHANGE RATE UPDATE RPC FUNCTION
-- Run this in Supabase SQL Editor AFTER running fix_settings_integrity.sql
-- This function guarantees a single atomic operation to prevent cardinality violations
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_atomic_exchange_rate_update(p_new_rate NUMERIC(20, 2))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id UUID;
BEGIN
  -- Step 1: Check if the key exists (single read operation)
  SELECT id INTO v_existing_id
  FROM settings
  WHERE key = 'exchange_rate'
  LIMIT 1;
  
  -- Step 2: Perform either UPDATE or INSERT based on existence
  IF v_existing_id IS NOT NULL THEN
    -- Key exists: perform single UPDATE
    UPDATE settings
    SET 
      value = p_new_rate::TEXT,
      description = 'Exchange rate from USD to SYP',
      updated_at = NOW()
    WHERE id = v_existing_id;
  ELSE
    -- Key doesn't exist: perform single INSERT
    INSERT INTO settings (key, value, description)
    VALUES ('exchange_rate', p_new_rate::TEXT, 'Exchange rate from USD to SYP');
  END IF;
  
  -- Step 3: Verify only one row exists (safety check)
  IF (SELECT COUNT(*) FROM settings WHERE key = 'exchange_rate') > 1 THEN
    -- Emergency cleanup: delete all but the most recent
    DELETE FROM settings
    WHERE key = 'exchange_rate'
    AND id NOT IN (
      SELECT id
      FROM settings
      WHERE key = 'exchange_rate'
      ORDER BY updated_at DESC
      LIMIT 1
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in execute_atomic_exchange_rate_update: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_atomic_exchange_rate_update(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_atomic_exchange_rate_update(NUMERIC) TO service_role;

-- ============================================================================
-- VERIFICATION
-- Run this to verify the function was created successfully:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_name = 'execute_atomic_exchange_rate_update';
-- ============================================================================
