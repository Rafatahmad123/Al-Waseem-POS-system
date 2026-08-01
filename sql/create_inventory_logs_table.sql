-- Inventory Logs table for tracking all stock movements
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  old_stock INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  stock_diff INTEGER NOT NULL DEFAULT 0,
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'return')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX idx_inventory_logs_movement_type ON inventory_logs(movement_type);

-- Trigger to update updated_at on inventory_logs
CREATE TRIGGER update_inventory_logs_updated_at BEFORE UPDATE ON inventory_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
