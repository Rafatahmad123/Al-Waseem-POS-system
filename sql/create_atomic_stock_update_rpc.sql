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
