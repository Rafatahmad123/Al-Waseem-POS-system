-- Customer ledger table for tracking all customer transactions
CREATE TABLE customer_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'payment')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_customer_ledger_customer_id ON customer_ledger(customer_id);
CREATE INDEX idx_customer_ledger_sale_id ON customer_ledger(sale_id);
CREATE INDEX idx_customer_ledger_transaction_type ON customer_ledger(transaction_type);
CREATE INDEX idx_customer_ledger_created_at ON customer_ledger(created_at);

-- Composite index for customer transaction history
CREATE INDEX idx_customer_ledger_customer_created ON customer_ledger(customer_id, created_at DESC);
