# Mixed Pricing Model Implementation

## Overview
This implementation adds support for mixed pricing models to handle market volatility. Products can now be priced in either:
- **USD (Fluctuating)**: Price in USD, SYP calculated dynamically based on exchange rate
- **SYP (Fixed)**: Price in SYP stays constant, USD equivalent changes with exchange rate

## Database Migration

### Step 1: Apply Migration
Run the following SQL migration to add the `price_type` field to the products table:

```bash
# Execute the migration file
psql -U your_username -d your_database -f migrations/add_price_type_to_products.sql
```

Or run the SQL directly:
```sql
-- Add price_type field to products table
ALTER TABLE products
ADD COLUMN price_type VARCHAR(10) NOT NULL DEFAULT 'USD';

-- Add a check constraint to ensure only valid values
ALTER TABLE products
ADD CONSTRAINT chk_price_type CHECK (price_type IN ('USD', 'SYP'));

-- Add comment for documentation
COMMENT ON COLUMN products.price_type IS 'Pricing type: USD (price fluctuates with exchange rate) or SYP (fixed SYP price, USD equivalent changes)';
```

### Step 2: Update Database Trigger
The database trigger `auto_calculate_selling_prices` has been updated to handle both pricing types. It now:
- For `price_type = 'USD'`: Calculates USD first, then derives SYP
- For `price_type = 'SYP'`: Calculates SYP first, then derives USD

The `update_all_product_prices` function has also been updated to:
- Update SYP prices for USD-based products when exchange rate changes
- Update USD prices for SYP-fixed products when exchange rate changes (their USD equivalent changes)

## Code Changes Summary

### 1. Database Schema (`schema.sql`)
- Added `price_type VARCHAR(10) NOT NULL DEFAULT 'USD'` to products table
- Added CHECK constraint for valid values ('USD', 'SYP')
- Updated `auto_calculate_selling_prices()` trigger to handle both pricing types
- Updated `update_all_product_prices()` function to recalculate based on price_type

### 2. TypeScript Types (`lib/types/database.ts`)
- Added `price_type: 'USD' | 'SYP'` to Product Row, Insert, and Update interfaces
- Updated SalesManager Product interface to include price_type
- Updated ProductsManager Product interface to include price_type

### 3. Product Actions (`app/actions/products.ts`)
- **createProduct()**: Now accepts `price_type` parameter and calculates prices accordingly
  - USD type: USD is primary, SYP = USD * exchangeRate
  - SYP type: SYP is primary, USD = SYP / exchangeRate
- **updateProduct()**: Same logic as createProduct for price updates

### 4. Product Form (`components/products/ProductsManager.tsx`)
- Added pricing type selector dropdown (USD / Fixed SYP)
- Updated `handleCostPriceChange()` to auto-calculate based on selected price_type
- Updated `handlePriceChange()` to update the other currency based on price_type
- Updated form state to include `price_type` field
- Updated `handleEdit()` to load the product's price_type
- Updated `resetForm()` to reset price_type to 'USD'

### 5. SalesManager (`components/sales/SalesManager.tsx`)
- Updated Product interface to include `price_type`
- **handleAddToCart()**: Calculates prices based on product's price_type
  - USD type: SYP = USD * currentExchangeRate
  - SYP type: SYP = stored SYP price (constant), USD = SYP / currentExchangeRate
- **handleWeightSubmit()**: Same logic for bulk items
- **Product Grid Display**: Shows prices based on price_type
  - USD type: Shows USD + calculated SYP
  - SYP type: Shows calculated USD + stored SYP
- Passes `priceType` to cart when adding items

### 6. Cart Store (`lib/store/cartStore.ts`)
- Added `priceType: 'USD' | 'SYP'` to CartItem interface
- Updated `recalculateAllSYPPrices()` to handle both types:
  - USD type: Recalculates SYP = USD * newExchangeRate
  - SYP type: Recalculates USD = SYP / newExchangeRate (SYP stays constant)
- Manual price overrides are still preserved during recalculation

## How It Works

### Product Creation/Editing
1. User selects pricing type (USD or Fixed SYP)
2. User enters cost price and selling price in the primary currency
3. System automatically calculates the secondary currency based on exchange rate
4. Product is saved with both prices and the price_type

### POS Sales Screen
1. Products display in grid with prices calculated based on their price_type
2. When adding to cart:
   - USD products: SYP = USD * currentExchangeRate
   - SYP products: SYP = stored SYP price (constant)
3. Cart stores the priceType for each item
4. When exchange rate changes:
   - USD items: SYP price recalculated
   - SYP items: USD price recalculated (SYP stays constant)
   - Manual overrides: Preserved regardless of type

### Exchange Rate Updates
1. When exchange rate is updated in Settings:
   - `/dashboard/sales/new` is revalidated
   - SalesManager polls for changes every 30 seconds
   - Cart items are recalculated based on their price_type
   - Manual price overrides are preserved

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] TypeScript compilation passes
- [ ] Product creation works with USD pricing type
- [ ] Product creation works with SYP pricing type
- [ ] Product editing preserves price_type
- [ ] POS grid displays correct prices for both types
- [ ] Adding USD products to cart calculates SYP correctly
- [ ] Adding SYP products to cart uses stored SYP price
- [ ] Bulk items work with both pricing types
- [ ] Exchange rate changes recalculate USD items correctly
- [ ] Exchange rate changes recalculate SYP items' USD correctly
- [ ] Manual price overrides are preserved during recalculation
- [ ] Cart totals are correct for mixed pricing types
- [ ] Barcode scanning works with both pricing types

## Rollback Plan

If issues arise, you can rollback by:
1. Reverting code changes
2. Removing the `price_type` column from the database:
   ```sql
   ALTER TABLE products DROP COLUMN IF EXISTS price_type;
   ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_price_type;
   ```
3. Restoring the original trigger and function versions

## Notes

- Existing products default to 'USD' pricing type
- The system is backward compatible with existing data
- Manual price overrides in the cart are always preserved
- Exchange rate polling ensures real-time updates
- The trigger handles automatic price calculations on cost price changes
