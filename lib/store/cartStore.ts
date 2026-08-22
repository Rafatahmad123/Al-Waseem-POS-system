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
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateItemPrice: (productId: string, sellingPriceUSD: number, sellingPriceSYP: number) => void
  clearCart: () => void
  getTotalUSD: () => number
  getTotalSYP: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item, quantity = 1) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.productId === item.productId)
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: Math.min(newQuantity, i.currentStock) }
              : i
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity }] }
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

  updateItemPrice: (productId, sellingPriceUSD, sellingPriceSYP) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, sellingPriceUSD, sellingPriceSYP }
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
