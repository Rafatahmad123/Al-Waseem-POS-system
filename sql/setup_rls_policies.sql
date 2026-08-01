-- ============================================================================
-- SETUP RLS POLICIES FOR INVENTORY_LOGS AND PRODUCTS TABLES
-- Run this in Supabase SQL Editor to enable proper Row Level Security
-- ============================================================================

-- ============================================================================
-- INVENTORY_LOGS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on inventory_logs
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated read inventory_logs" ON inventory_logs;
DROP POLICY IF EXISTS "Allow authenticated insert inventory_logs" ON inventory_logs;
DROP POLICY IF EXISTS "Allow authenticated update inventory_logs" ON inventory_logs;
DROP POLICY IF EXISTS "Service role full access inventory_logs" ON inventory_logs;

-- Create comprehensive RLS policies for inventory_logs
-- Policy 1: Authenticated users can read
CREATE POLICY "Allow authenticated read inventory_logs"
  ON inventory_logs FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Authenticated users can insert
CREATE POLICY "Allow authenticated insert inventory_logs"
  ON inventory_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Authenticated users can update
CREATE POLICY "Allow authenticated update inventory_logs"
  ON inventory_logs FOR UPDATE
  TO authenticated
  USING (true);

-- Policy 4: Service role has full access (bypasses RLS)
CREATE POLICY "Service role full access inventory_logs"
  ON inventory_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PRODUCTS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON products;
DROP POLICY IF EXISTS "Service role full access products" ON products;

-- Create comprehensive RLS policies for products
-- Policy 1: Authenticated users can read
CREATE POLICY "Allow authenticated read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Authenticated users can insert
CREATE POLICY "Allow authenticated insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Authenticated users can update
CREATE POLICY "Allow authenticated update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

-- Policy 4: Authenticated users can delete
CREATE POLICY "Allow authenticated delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Policy 5: Service role has full access (bypasses RLS)
CREATE POLICY "Service role full access products"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant permissions on inventory_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_logs TO authenticated;
GRANT ALL PRIVILEGES ON inventory_logs TO service_role;

-- Grant permissions on products
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT ALL PRIVILEGES ON products TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES (run these after the script to verify)
-- ============================================================================

-- Check RLS policies for inventory_logs
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'inventory_logs';

-- Check RLS policies for products
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'products';

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('inventory_logs', 'products');
