# Inventory Logging Deployment Guide

This guide outlines the steps to deploy the new inventory logging system with atomic operations.

## Overview

The refactoring implements strict inventory management rules:
- **Inventory Movement Log**: All stock changes are logged in `inventory_logs` table
- **Atomic Operations**: Stock updates and logging are performed as a single transaction
- **Soft Delete Enforcement**: Products use `is_active: false` instead of deletion
- **Query Filtering**: All product queries include `.eq('is_active', true)` filter
- **Transaction Logic**: Stock differences are calculated and logged with movement types
- **Data Integrity**: Complete audit trail for all stock movements

## Database Schema Changes

### 1. Create inventory_logs Table

Execute the SQL file in order:
```bash
# In Supabase SQL Editor or via CLI
psql -h your-db-host -U postgres -d your-database -f sql/create_inventory_logs_table.sql
```

Or run the SQL directly in Supabase Dashboard:
```sql
-- Inventory Logs table for tracking all stock movements
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  old_stock INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  stock_diff INTEGER NOT NULL DEFAULT 0,
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'return')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX idx_inventory_logs_movement_type ON inventory_logs(movement_type);

-- Trigger to update updated_at on inventory_logs
CREATE TRIGGER update_inventory_logs_updated_at BEFORE UPDATE ON inventory_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Create Atomic Stock Update RPC Function

Execute the SQL file:
```bash
psql -h your-db-host -U postgres -d your-database -f sql/create_atomic_stock_update_rpc.sql
```

Or run directly in Supabase Dashboard:
```sql
-- RPC function for atomic stock update with inventory logging
CREATE OR REPLACE FUNCTION update_product_stock_with_log(
  p_product_id UUID,
  p_new_stock INTEGER,
  p_movement_type VARCHAR,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_old_stock INTEGER;
  v_stock_diff INTEGER;
  v_updated_product RECORD;
BEGIN
  -- Lock the product row to prevent concurrent modifications
  SELECT current_stock INTO v_old_stock
  FROM products
  WHERE id = p_product_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Product not found or inactive');
  END IF;

  -- Calculate stock difference
  v_stock_diff := p_new_stock - v_old_stock;

  -- Only log if there's an actual stock change
  IF v_stock_diff != 0 THEN
    -- Insert inventory log
    INSERT INTO inventory_logs (
      product_id,
      old_stock,
      new_stock,
      stock_diff,
      movement_type,
      notes
    ) VALUES (
      p_product_id,
      v_old_stock,
      p_new_stock,
      v_stock_diff,
      p_movement_type,
      p_notes
    );
  END IF;

  -- Update product stock
  UPDATE products
  SET current_stock = p_new_stock
  WHERE id = p_product_id AND is_active = true
  RETURNING * INTO v_updated_product;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Failed to update product');
  END IF;

  RETURN json_build_object(
    'success', true,
    'data', to_json(v_updated_product),
    'old_stock', v_old_stock,
    'new_stock', p_new_stock,
    'stock_diff', v_stock_diff
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_product_stock_with_log TO authenticated;
```

## Application Code Changes

The following files have been refactored:

### 1. `app/actions/products.ts`
- Added `MovementType` type definition
- Exported `logInventoryMovement()` helper function
- Exported `updateStockAtomically()` for atomic stock updates
- Added `.eq('is_active', true)` filter to `getProductById()`
- Implemented inventory logging in `createProduct()` for initial stock
- Implemented inventory logging in `updateProduct()` with stock diff calculation
- Soft delete already enforced in `deleteProduct()`

### 2. `app/actions/sales.ts`
- Imported `updateStockAtomically` from products.ts
- Refactored `createSale()` to use atomic stock updates with 'sale' movement type
- Refactored `deleteSale()` to use atomic stock updates with 'return' movement type
- Added `.eq('is_active', true)` filters for product queries

### 3. `app/actions/purchases.ts`
- Imported `updateStockAtomically` from products.ts
- Refactored `createPurchase()` to use atomic stock updates with 'purchase' movement type
- Refactored `deletePurchase()` to use atomic stock updates with 'adjustment' movement type
- Added `.eq('is_active', true)` filters for product queries

## Movement Types

The system uses four movement types for inventory logging:

- **`sale`**: Stock deduction when a sale is made
- **`purchase`**: Stock addition when a purchase is recorded
- **`adjustment`**: Manual stock adjustments or purchase reversals
- **`return`**: Stock restoration when a sale is deleted

## Verification Steps

After deployment, verify the system:

1. **Test Product Creation**
   - Create a product with initial stock > 0
   - Check `inventory_logs` table for a 'purchase' movement entry

2. **Test Product Update**
   - Update a product's stock level
   - Check `inventory_logs` table for an 'adjustment' movement entry

3. **Test Sale Creation**
   - Create a sale with items
   - Check `inventory_logs` table for 'sale' movement entries
   - Verify product stock decreased

4. **Test Sale Deletion**
   - Delete a sale
   - Check `inventory_logs` table for 'return' movement entries
   - Verify product stock restored

5. **Test Purchase Creation**
   - Create a purchase with items
   - Check `inventory_logs` table for 'purchase' movement entries
   - Verify product stock increased

6. **Test Purchase Deletion**
   - Delete a purchase
   - Check `inventory_logs` table for 'adjustment' movement entries
   - Verify product stock decreased

7. **Test Soft Delete**
   - Delete a product
   - Verify `is_active` is set to false
   - Verify product no longer appears in queries

## Rollback Procedure

If issues arise, rollback steps:

1. Revert application code changes
2. Drop the RPC function:
   ```sql
   DROP FUNCTION IF EXISTS update_product_stock_with_log(UUID, INTEGER, VARCHAR, TEXT);
   ```
3. Drop the inventory_logs table:
   ```sql
   DROP TABLE IF EXISTS inventory_logs CASCADE;
   ```

## Notes

- All stock operations now require the `inventory_logs` table to exist
- The RPC function uses row-level locking to prevent race conditions
- Stock changes are only logged if the difference is non-zero
- The system maintains a complete audit trail of all inventory movements
- Soft delete is enforced across all product-related operations
