-- Expenses table for tracking business expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'SYP')),
  category VARCHAR(100),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_currency ON expenses(currency);
CREATE INDEX idx_expenses_is_active ON expenses(is_active);

-- Apply updated_at trigger to expenses table
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default expense categories (optional - can be managed via UI)
-- These are just examples, can be customized
INSERT INTO expenses (description, amount, currency, category, expense_date, notes) VALUES
  ('Sample Expense - Rent', 1000.00, 'USD', 'Rent', CURRENT_DATE, 'Monthly rent payment'),
  ('Sample Expense - Utilities', 150.00, 'USD', 'Utilities', CURRENT_DATE, 'Electricity and water')
ON CONFLICT DO NOTHING;
