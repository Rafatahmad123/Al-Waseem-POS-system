-- Atomic RPC function for customer debt payments
-- This ensures both customer balance update and ledger entry succeed or fail together
CREATE OR REPLACE FUNCTION process_customer_payment(
  p_customer_id UUID,
  p_payment_amount NUMERIC(20, 2),
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_current_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
  v_ledger_id UUID;
BEGIN
  -- Get current customer balance
  SELECT current_balance INTO v_current_balance
  FROM customers
  WHERE id = p_customer_id AND is_active = true;
  
  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Customer not found or inactive');
  END IF;
  
  -- Validate payment amount
  IF p_payment_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Payment amount must be positive');
  END IF;
  
  -- Calculate new balance
  -- Cast payment_amount to DECIMAL(10,2) to match customer balance precision
  v_new_balance := v_current_balance - CAST(p_payment_amount AS DECIMAL(10, 2));
  
  -- Update customer balance
  UPDATE customers
  SET current_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_customer_id;
  
  -- Create ledger entry
  INSERT INTO customer_ledger (customer_id, transaction_type, amount, balance_after, notes)
  VALUES (p_customer_id, 'payment', CAST(p_payment_amount AS DECIMAL(10, 2)), v_new_balance, p_notes)
  RETURNING id INTO v_ledger_id;
  
  -- Return success with updated data
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'customer_id', p_customer_id,
      'old_balance', v_current_balance,
      'payment_amount', p_payment_amount,
      'new_balance', v_new_balance,
      'ledger_id', v_ledger_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic RPC function for recording credit sales
-- This ensures both customer balance increase and ledger entry succeed or fail together
CREATE OR REPLACE FUNCTION record_credit_sale(
  p_customer_id UUID,
  p_sale_amount NUMERIC(20, 2),
  p_sale_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_current_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
  v_ledger_id UUID;
BEGIN
  -- Get current customer balance
  SELECT current_balance INTO v_current_balance
  FROM customers
  WHERE id = p_customer_id AND is_active = true;
  
  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Customer not found or inactive');
  END IF;
  
  -- Validate sale amount
  IF p_sale_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Sale amount must be positive');
  END IF;
  
  -- Calculate new balance (increase debt)
  -- Cast sale_amount to DECIMAL(10,2) to match customer balance precision
  v_new_balance := v_current_balance + CAST(p_sale_amount AS DECIMAL(10, 2));
  
  -- Update customer balance
  UPDATE customers
  SET current_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_customer_id;
  
  -- Create ledger entry
  INSERT INTO customer_ledger (customer_id, sale_id, transaction_type, amount, balance_after, notes)
  VALUES (p_customer_id, p_sale_id, 'purchase', CAST(p_sale_amount AS DECIMAL(10, 2)), v_new_balance, p_notes)
  RETURNING id INTO v_ledger_id;
  
  -- Return success with updated data
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'customer_id', p_customer_id,
      'old_balance', v_current_balance,
      'sale_amount', p_sale_amount,
      'new_balance', v_new_balance,
      'ledger_id', v_ledger_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
