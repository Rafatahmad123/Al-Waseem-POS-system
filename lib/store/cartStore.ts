import { create } from 'zustand'

export interface CartItem {
  productId: string
  barcode: string
  name: string
  sellingPriceUSD: number
  sellingPriceSYP: number
  quantity: number
  currentStock: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalUSD: () => number
  getTotalSYP: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.productId === item.productId)
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: Math.min(i.quantity + 1, i.currentStock) }
              : i
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity: 1 }] }
    })
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }))
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(0, Math.min(quantity, i.currentStock)) }
          : i
      ),
    }))
  },

  clearCart: () => {
    set({ items: [] })
  },

  getTotalUSD: () => {
    return get().items.reduce((total, item) => total + item.sellingPriceUSD * item.quantity, 0)
  },

  getTotalSYP: () => {
    return get().items.reduce((total, item) => total + item.sellingPriceSYP * item.quantity, 0)
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  },
}))
