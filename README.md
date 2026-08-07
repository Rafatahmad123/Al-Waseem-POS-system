# Al-Kholoud Market & Coffee Roastery POS System

A modern Point of Sale (POS) and inventory management system built with Next.js 16, Supabase, and TypeScript. Features dual-currency support (USD/SYP), FIFO stock management, and comprehensive analytics.

## Features

- **Product Management**: Full CRUD operations with barcode support, pricing in USD/SYP, and stock tracking
- **Category Management**: Organize products into categories
- **Point of Sale**: POS interface with cart management, real-time stock validation, and checkout
- **Purchase Management**: Register inventory purchases with batch tracking and expiry dates
- **Supplier Management**: Manage supplier information
- **Analytics Dashboard**: Sales trends, low stock alerts, and business metrics
- **Dual Currency Support**: Automatic conversion between USD and SYP with configurable exchange rates
- **FIFO Stock Deduction**: Automatic stock deduction using First-In-First-Out logic
- **Print Invoices**: Professional A5 invoice printing with CSS print media queries

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL database, Auth, Realtime)
- **State Management**: Zustand for client-side state
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts for analytics visualization
- **UI Components**: Radix UI primitives with shadcn/ui

## Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account (free tier works)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd alkholoud-market-pos
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to the SQL Editor in your Supabase dashboard
3. Run the SQL schema from `schema.sql` to create all tables and relationships
4. Navigate to Settings > API to get your credentials

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Get these values from your Supabase project settings:
- **Project URL**: Found in Settings > API
- **Anon Key**: Found in Settings > API (public anon key)

### 5. Initialize Settings

After setting up the database, you need to insert initial settings:

```sql
INSERT INTO settings (key, value) VALUES 
('exchange_rate', '12500'),
('pricing_mode', 'USD');
```

You can adjust the exchange_rate (SYP per USD) as needed.

### 6. Add the First Admin User

Using Supabase Auth:

1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add User" > "Create New User"
3. Enter email and password for your admin account
4. Click "Create User"
5. The user will be created and can immediately log in

Alternatively, you can use the Supabase CLI:

```bash
npx supabase auth signup --email admin@example.com --password your-password
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The system uses the following main tables:

- **products**: Product inventory with pricing and stock
- **categories**: Product categories
- **sales**: Sales transactions
- **sale_items**: Line items for sales
- **purchases**: Purchase orders from suppliers
- **purchase_items**: Line items for purchases
- **stock_batches**: Stock batches with FIFO tracking
- **suppliers**: Supplier information
- **settings**: Application settings (exchange rate, pricing mode)

See `schema.sql` for the complete schema definition.

## Deployment to Vercel

### 1. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### 2. Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the same variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Deploy Supabase

Your Supabase project is already deployed in the cloud. No additional deployment needed.

### 4. Verify Deployment

After deployment, test your application by:
- Logging in with your admin user
- Creating a category
- Adding a product
- Making a test sale
- Checking the dashboard analytics

## Project Structure

```
alkholoud-market-pos/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── page.tsx         # Dashboard with analytics
│   │   ├── categories/      # Category management
│   │   ├── products/        # Product management
│   │   ├── sales/           # POS and sales
│   │   └── purchases/       # Purchase management
│   ├── actions/             # Server Actions
│   │   ├── analytics.ts     # Analytics data
│   │   ├── categories.ts    # Category CRUD
│   │   ├── products.ts      # Product CRUD
│   │   ├── sales.ts         # Sales with FIFO
│   │   ├── purchases.ts     # Purchases and stock
│   │   └── suppliers.ts     # Supplier CRUD
│   ├── api/                 # API routes
│   ├── login/               # Login page
│   └── layout.tsx           # Root layout
├── components/              # Client components
│   ├── categories/
│   ├── products/
│   ├── sales/
│   └── purchases/
├── lib/
│   ├── pricing.ts          # Currency conversion utilities
│   ├── inventory.ts        # Stock calculation utilities
│   ├── store/
│   │   └── cartStore.ts    # Zustand cart state
│   ├── supabaseClient.ts   # Supabase client
│   └── types/
│       └── database.ts     # TypeScript types
└── schema.sql              # Database schema
```

## Usage Guide

### Managing Products

1. Navigate to Products in the dashboard
2. Click "Add Product"
3. Fill in product details (barcode, name, prices, stock levels)
4. Prices are automatically converted between USD and SYP based on current exchange rate

### Making a Sale

1. Navigate to Sales in the dashboard
2. Search for products by name or barcode
3. Click on a product to add to cart
4. Adjust quantities as needed
5. Click "Complete Sale" to finalize
6. Stock is automatically deducted using FIFO logic

### Recording Purchases

1. Navigate to Purchases in the dashboard
2. Click "New Purchase"
3. Select supplier (optional)
4. Add products with quantity, cost, batch number, and expiry date
5. Click "Create Purchase"
6. Stock is automatically added to inventory

### Viewing Analytics

1. Navigate to Dashboard home
2. View today's sales, low stock alerts, and monthly purchases
3. Check the 7-day sales trend chart

### Printing Invoices

1. Navigate to Sales
2. Click on a sale to view details
3. Click "Print Invoice" to print the A5 invoice

## Troubleshooting

### Authentication Issues

- Ensure your environment variables are correctly set
- Check that your Supabase Auth is enabled
- Verify the user exists in Supabase Authentication > Users

### Stock Inconsistencies

- The dashboard automatically verifies stock by aggregating stock_batches
- If you see discrepancies, check the stock_batches table
- The system uses FIFO for stock deduction

### Currency Conversion

- Exchange rate is stored in the settings table
- Update it via SQL: `UPDATE settings SET value = 'new_rate' WHERE key = 'exchange_rate'`
- The system fetches the rate automatically for conversions

## License

This project is proprietary software for Al-Kholoud Market & Coffee Roastery.

## Support

For issues or questions, please contact the development team.
