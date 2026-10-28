-- Add price_type field to products table
-- This allows products to have either USD-based pricing (fluctuates with exchange rate)
-- or SYP-fixed pricing (SYP price stays constant, USD equivalent changes with exchange rate)

-- Add the column with a default value of 'USD' for existing products
ALTER TABLE products
ADD COLUMN price_type VARCHAR(10) NOT NULL DEFAULT 'USD';

-- Add a check constraint to ensure only valid values
ALTER TABLE products
ADD CONSTRAINT chk_price_type CHECK (price_type IN ('USD', 'SYP'));

-- Add comment for documentation
COMMENT ON COLUMN products.price_type IS 'Pricing type: USD (price fluctuates with exchange rate) or SYP (fixed SYP price, USD equivalent changes)';
