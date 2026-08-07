-- Migration: Add expiry_date column to products table
-- This script adds the expiry_date column to existing products tables
-- Run this if you already have the products table created

-- Add the expiry_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN expiry_date DATE;
        
        RAISE NOTICE 'expiry_date column added successfully';
    ELSE
        RAISE NOTICE 'expiry_date column already exists';
    END IF;
END $$;

-- Create index on expiry_date for faster expiry report queries
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON public.products(expiry_date);

-- Grant permissions on the new column
GRANT SELECT, UPDATE ON public.products TO anon;
GRANT SELECT, UPDATE ON public.products TO authenticated;

-- Notify API to reload schema
NOTIFY pgrst;
