-- Add customer_id and payment_type columns to sales table
ALTER TABLE sales 
ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN payment_type VARCHAR(20) NOT NULL DEFAULT 'Cash' CHECK (payment_type IN ('Cash', 'Credit'));

-- Create index for customer_id to improve query performance
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_payment_type ON sales(payment_type);

-- Add comment to document the new columns
COMMENT ON COLUMN sales.customer_id IS 'Reference to customer if sale is on credit';
COMMENT ON COLUMN sales.payment_type IS 'Payment method: Cash or Credit';
