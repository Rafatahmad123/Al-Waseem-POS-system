import { getCategories } from '@/app/actions/products'
import { ArrowLeft, Package, DollarSign, Tag, Barcode } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createProduct } from '@/app/actions/products'

export default async function NewProductPage() {
  const categories = await getCategories()

  async function handleCreateProduct(formData: FormData) {
    'use server'
    const result = await createProduct(formData)
    if (result.error) {
      throw new Error(result.error)
    }
    redirect('/dashboard/products')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/products"
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">إضافة منتج جديد</h2>
          <p className="text-slate-600 mt-1">تسجيل منتج جديد في النظام</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <form action={handleCreateProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                اسم المنتج *
              </label>
              <div className="relative">
                <Package className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم المنتج"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                الباركود
              </label>
              <div className="relative">
                <Barcode className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="barcode"
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="باركود المنتج"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                الفئة
              </label>
              <div className="relative">
                <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  name="category_id"
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر الفئة</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                سعر التكلفة (دولار) *
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  name="cost_price"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                سعر البيع (دولار)
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  name="selling_price_usd"
                  step="0.01"
                  min="0.01"
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-calculated from cost (20% markup)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                سعر البيع (ليرة)
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  name="selling_price_syp"
                  step="0.01"
                  min="0.01"
                  className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-calculated from USD price"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                المخزون الأولي *
              </label>
              <input
                type="number"
                name="current_stock"
                min="0"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                الحد الأدنى للمخزون
              </label>
              <input
                type="number"
                name="min_stock_level"
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                الوصف
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="وصف المنتج (اختياري)"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              حفظ المنتج
            </button>
            <Link
              href="/dashboard/products"
              className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 transition-colors"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
