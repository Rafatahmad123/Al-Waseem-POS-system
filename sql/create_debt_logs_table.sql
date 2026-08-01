-- Debt Logs table for tracking all debt modifications and payments
CREATE TABLE debt_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE RESTRICT,
  old_paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  new_paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_debt_logs_debt_id ON debt_logs(debt_id);
CREATE INDEX idx_debt_logs_created_at ON debt_logs(created_at);

-- Trigger to update updated_at on debt_logs
CREATE TRIGGER update_debt_logs_updated_at BEFORE UPDATE ON debt_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
