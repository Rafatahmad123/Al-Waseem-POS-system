-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  selling_price_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
  selling_price_syp DECIMAL(10, 2) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for barcode
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category_id ON products(category_id);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Batches table
CREATE TABLE stock_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  batch_number VARCHAR(100),
  quantity INTEGER NOT NULL,
  cost_per_unit DECIMAL(10, 2) NOT NULL,
  purchase_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_batches_product_id ON stock_batches(product_id);
CREATE INDEX idx_stock_batches_supplier_id ON stock_batches(supplier_id);

-- Purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_purchases_purchase_date ON purchases(purchase_date);

-- Purchase Items table
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  cost_per_unit DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product_id ON purchase_items(product_id);

-- Sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sales_sale_date ON sales(sale_date);

-- Sale Items table
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  selling_price_usd DECIMAL(10, 2) NOT NULL,
  selling_price_syp DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Settings table (key-value pairs)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('exchange_rate', '12500', 'Exchange rate from USD to SYP'),
  ('pricing_mode', 'USD', 'Default pricing mode: USD or SYP'),
  ('company_name', 'Al-Waseem POS', 'Company name for receipts and invoices'),
  ('tax_rate', '0', 'Tax rate percentage');

-- Add CHECK constraint for pricing_mode in settings
ALTER TABLE settings 
ADD CONSTRAINT chk_pricing_mode_value 
CHECK (key = 'pricing_mode' AND value IN ('USD', 'SYP') OR key != 'pricing_mode');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-calculate selling prices when cost_price changes
CREATE OR REPLACE FUNCTION auto_calculate_selling_prices()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate selling_price_usd with 20% profit margin
  NEW.selling_price_usd = NEW.cost_price * 1.20;
  
  -- Auto-calculate selling_price_syp using exchange rate from settings
  -- Default to 12500 if exchange rate not found
  DECLARE exchange_rate_value DECIMAL(10, 2);
  BEGIN
    SELECT CAST(value AS DECIMAL(10, 2)) INTO exchange_rate_value
    FROM settings
    WHERE key = 'exchange_rate'
    LIMIT 1;
    
    IF exchange_rate_value IS NULL OR exchange_rate_value = 0 THEN
      exchange_rate_value := 12500;
    END IF;
    
    NEW.selling_price_syp = NEW.selling_price_usd * exchange_rate_value;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to default exchange rate if query fails
    NEW.selling_price_syp = NEW.selling_price_usd * 12500;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger on INSERT and UPDATE of cost_price
CREATE TRIGGER trigger_auto_calculate_prices
  BEFORE INSERT OR UPDATE OF cost_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_selling_prices();

-- Function to update all product prices when exchange rate changes
CREATE OR REPLACE FUNCTION update_all_product_prices(new_rate DECIMAL)
RETURNS VOID AS $$
BEGIN
  -- Update selling_price_syp for all products using the new exchange rate
  UPDATE products
  SET selling_price_syp = selling_price_usd * new_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
