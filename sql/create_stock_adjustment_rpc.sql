-- Create atomic RPC function for stock adjustment during stocktake
CREATE OR REPLACE FUNCTION adjust_stock_for_stocktake(
  p_product_id UUID,
  p_physical_stock INTEGER,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_current_stock INTEGER;
  v_adjustment INTEGER;
  v_latest_batch_id UUID;
  v_latest_batch_quantity INTEGER;
  v_new_batch_quantity INTEGER;
  v_product_name VARCHAR;
BEGIN
  -- Get current stock and product name
  SELECT current_stock, name INTO v_current_stock, v_product_name
  FROM products
  WHERE id = p_product_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Product not found');
  END IF;
  
  -- Calculate adjustment
  v_adjustment := p_physical_stock - v_current_stock;
  
  -- If no adjustment needed, return success
  IF v_adjustment = 0 THEN
    RETURN json_build_object('success', true, 'message', 'No adjustment needed');
  END IF;
  
  -- Get latest stock batch for this product
  SELECT id, quantity INTO v_latest_batch_id, v_latest_batch_quantity
  FROM stock_batches
  WHERE product_id = p_product_id
  ORDER BY purchase_date DESC, created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No stock batch found for product');
  END IF;
  
  -- Calculate new batch quantity
  v_new_batch_quantity := v_latest_batch_quantity + v_adjustment;
  
  -- Ensure new quantity is not negative
  IF v_new_batch_quantity < 0 THEN
    RETURN json_build_object('error', 'Cannot adjust to negative stock');
  END IF;
  
  -- Start transaction (PostgreSQL functions are already transactional)
  -- Update stock batch quantity
  UPDATE stock_batches
  SET quantity = v_new_batch_quantity
  WHERE id = v_latest_batch_id;
  
  -- Update product current stock
  UPDATE products
  SET current_stock = p_physical_stock
  WHERE id = p_product_id;
  
  -- Log inventory movement
  INSERT INTO inventory_logs (
    product_id,
    quantity,
    movement_type,
    notes,
    created_at
  ) VALUES (
    p_product_id,
    ABS(v_adjustment),
    CASE 
      WHEN v_adjustment > 0 THEN 'stocktake_addition'
      ELSE 'stocktake_reduction'
    END,
    COALESCE(p_notes, 'Stocktake adjustment: ' || v_product_name || ' from ' || v_current_stock || ' to ' || p_physical_stock),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Stock adjusted successfully',
    'previous_stock', v_current_stock,
    'new_stock', p_physical_stock,
    'adjustment', v_adjustment
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION adjust_stock_for_stocktake TO authenticated;
