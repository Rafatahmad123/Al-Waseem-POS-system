-- Create settings table for storing application settings (key-value pairs)
-- Run this in Supabase SQL Editor if the table doesn't exist

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert settings
CREATE POLICY "Allow authenticated users to insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update settings
CREATE POLICY "Allow authenticated users to update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true);

-- Insert default exchange rate setting
INSERT INTO settings (key, value, description)
VALUES ('exchange_rate', '12500', 'USD to SYP exchange rate')
ON CONFLICT (key) DO NOTHING;

-- Insert default pricing mode setting
INSERT INTO settings (key, value, description)
VALUES ('pricing_mode', 'USD', 'Default pricing mode: USD or SYP')
ON CONFLICT (key) DO NOTHING;
