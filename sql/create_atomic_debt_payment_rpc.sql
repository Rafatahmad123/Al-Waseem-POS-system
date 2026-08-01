-- RPC function for atomic debt payment recording with logging
CREATE OR REPLACE FUNCTION record_debt_payment_with_log(
  p_debt_id UUID,
  p_payment_amount DECIMAL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_old_paid_amount DECIMAL(10, 2);
  v_new_paid_amount DECIMAL(10, 2);
  v_total_amount DECIMAL(10, 2);
  v_new_status VARCHAR(50);
  v_updated_debt RECORD;
BEGIN
  -- Lock the debt row to prevent concurrent modifications
  SELECT paid_amount, total_amount INTO v_old_paid_amount, v_total_amount
  FROM debts
  WHERE id = p_debt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Debt not found');
  END IF;

  -- Validate payment amount
  IF p_payment_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Payment amount must be greater than 0');
  END IF;

  -- Calculate new paid amount
  v_new_paid_amount := v_old_paid_amount + p_payment_amount;

  -- Validate that payment doesn't exceed total
  IF v_new_paid_amount > v_total_amount THEN
    RETURN json_build_object('success', false, 'error', 'Payment amount exceeds remaining debt');
  END IF;

  -- Determine new status
  IF v_new_paid_amount >= v_total_amount THEN
    v_new_status := 'paid';
  ELSIF v_new_paid_amount > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Insert debt log
  INSERT INTO debt_logs (
    debt_id,
    old_paid_amount,
    new_paid_amount,
    payment_amount,
    notes
  ) VALUES (
    p_debt_id,
    v_old_paid_amount,
    v_new_paid_amount,
    p_payment_amount,
    p_notes
  );

  -- Update debt
  UPDATE debts
  SET 
    paid_amount = v_new_paid_amount,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = p_debt_id
  RETURNING * INTO v_updated_debt;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Failed to update debt');
  END IF;

  RETURN json_build_object(
    'success', true,
    'data', to_json(v_updated_debt),
    'old_paid_amount', v_old_paid_amount,
    'new_paid_amount', v_new_paid_amount,
    'payment_amount', p_payment_amount,
    'new_status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION record_debt_payment_with_log TO authenticated;
