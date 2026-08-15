export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          barcode: string
          name: string
          description: string | null
          category_id: string | null
          cost_price: number
          cost_price_syp: number
          selling_price_usd: number
          selling_price_syp: number
          current_stock: number
          min_stock_level: number
          expiry_date: string | null
          is_bulk: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barcode: string
          name: string
          description?: string | null
          category_id?: string | null
          cost_price?: number
          cost_price_syp?: number
          selling_price_usd?: number
          selling_price_syp?: number
          current_stock?: number
          min_stock_level?: number
          expiry_date?: string | null
          is_bulk?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barcode?: string
          name?: string
          description?: string | null
          category_id?: string | null
          cost_price?: number
          cost_price_syp?: number
          selling_price_usd?: number
          selling_price_syp?: number
          current_stock?: number
          min_stock_level?: number
          expiry_date?: string | null
          is_bulk?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stock_batches: {
        Row: {
          id: string
          product_id: string
          supplier_id: string | null
          batch_number: string | null
          quantity: number
          cost_per_unit: number
          purchase_date: string
          expiry_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          supplier_id?: string | null
          batch_number?: string | null
          quantity: number
          cost_per_unit: number
          purchase_date: string
          expiry_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          supplier_id?: string | null
          batch_number?: string | null
          quantity?: number
          cost_per_unit?: number
          purchase_date?: string
          expiry_date?: string | null
          created_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          supplier_id: string | null
          purchase_date: string
          total_amount: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          supplier_id?: string | null
          purchase_date?: string
          total_amount?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string | null
          purchase_date?: string
          total_amount?: number
          notes?: string | null
          created_at?: string
        }
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          product_id: string
          quantity: number
          cost_per_unit: number
          total_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id: string
          quantity: number
          cost_per_unit: number
          total_cost: number
          created_at?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string
          quantity?: number
          cost_per_unit?: number
          total_cost?: number
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          sale_date: string
          total_amount: number
          customer_id: string | null
          payment_type: string
          payment_method: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sale_date?: string
          total_amount?: number
          customer_id?: string | null
          payment_type?: string
          payment_method?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sale_date?: string
          total_amount?: number
          customer_id?: string | null
          payment_type?: string
          payment_method?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          quantity: number
          selling_price_usd: number
          selling_price_syp: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          product_id: string
          quantity: number
          selling_price_usd: number
          selling_price_syp: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string
          quantity?: number
          selling_price_usd?: number
          selling_price_syp?: number
          total_price?: number
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          customer_name: string
          total_amount: number
          paid_amount: number
          status: 'pending' | 'partially_paid' | 'paid'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          total_amount?: number
          paid_amount?: number
          status?: 'pending' | 'partially_paid' | 'paid'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          total_amount?: number
          paid_amount?: number
          status?: 'pending' | 'partially_paid' | 'paid'
          created_at?: string
          updated_at?: string
        }
      }
      debt_logs: {
        Row: {
          id: string
          debt_id: string
          old_paid_amount: number
          new_paid_amount: number
          payment_amount: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          debt_id: string
          old_paid_amount?: number
          new_paid_amount?: number
          payment_amount?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          debt_id?: string
          old_paid_amount?: number
          new_paid_amount?: number
          payment_amount?: number
          notes?: string | null
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          current_balance: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          current_balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          current_balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customer_ledger: {
        Row: {
          id: string
          customer_id: string
          sale_id: string | null
          transaction_type: string
          amount: number
          balance_after: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          sale_id?: string | null
          transaction_type: string
          amount: number
          balance_after: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          sale_id?: string | null
          transaction_type?: string
          amount?: number
          balance_after?: number
          notes?: string | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          description: string
          amount: number
          currency: string
          category: string | null
          expense_date: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          currency?: string
          category?: string | null
          expense_date?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          currency?: string
          category?: string | null
          expense_date?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type aliases for convenience
export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert']
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update']

export type StockBatch = Database['public']['Tables']['stock_batches']['Row']
export type StockBatchInsert = Database['public']['Tables']['stock_batches']['Insert']
export type StockBatchUpdate = Database['public']['Tables']['stock_batches']['Update']

export type Purchase = Database['public']['Tables']['purchases']['Row']
export type PurchaseInsert = Database['public']['Tables']['purchases']['Insert']
export type PurchaseUpdate = Database['public']['Tables']['purchases']['Update']

export type PurchaseItem = Database['public']['Tables']['purchase_items']['Row']
export type PurchaseItemInsert = Database['public']['Tables']['purchase_items']['Insert']
export type PurchaseItemUpdate = Database['public']['Tables']['purchase_items']['Update']

export type Sale = Database['public']['Tables']['sales']['Row']
export type SaleInsert = Database['public']['Tables']['sales']['Insert']
export type SaleUpdate = Database['public']['Tables']['sales']['Update']

export type SaleItem = Database['public']['Tables']['sale_items']['Row']
export type SaleItemInsert = Database['public']['Tables']['sale_items']['Insert']
export type SaleItemUpdate = Database['public']['Tables']['sale_items']['Update']

export type Setting = Database['public']['Tables']['settings']['Row']
export type SettingInsert = Database['public']['Tables']['settings']['Insert']
export type SettingUpdate = Database['public']['Tables']['settings']['Update']

export type Debt = Database['public']['Tables']['debts']['Row']
export type DebtInsert = Database['public']['Tables']['debts']['Insert']
export type DebtUpdate = Database['public']['Tables']['debts']['Update']

export type DebtLog = Database['public']['Tables']['debt_logs']['Row']
export type DebtLogInsert = Database['public']['Tables']['debt_logs']['Insert']
export type DebtLogUpdate = Database['public']['Tables']['debt_logs']['Update']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type CustomerLedger = Database['public']['Tables']['customer_ledger']['Row']
export type CustomerLedgerInsert = Database['public']['Tables']['customer_ledger']['Insert']
export type CustomerLedgerUpdate = Database['public']['Tables']['customer_ledger']['Update']

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

// Pricing mode enum
export type PricingMode = 'USD' | 'SYP'

// Debt status enum
export type DebtStatus = 'pending' | 'partially_paid' | 'paid'
