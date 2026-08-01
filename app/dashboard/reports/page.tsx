'use client'

import { useState, useEffect } from 'react'
import { getReportMetrics, getTopSellingProducts, DateRange } from '@/app/actions/reports'
import { formatCurrency } from '@/lib/pricing'
import { TrendingUp, DollarSign, Package, ShoppingCart, BarChart3, Lock, X } from 'lucide-react'

export default function ReportsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    totalSales: 0,
    totalItemsSold: 0,
  })
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
  })

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === '0123') {
      setIsAuthenticated(true)
      setPinError('')
    } else {
      setPinError('رمز المرور غير صحيح')
      setPin('')
    }
  }

  useEffect(() => {
    // Set default date range to last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    })
  }, [])

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      loadReportData()
    }
  }, [dateRange])

  async function loadReportData() {
    setIsLoading(true)
    const [metricsData, productsData] = await Promise.all([
      getReportMetrics(dateRange),
      getTopSellingProducts(dateRange, 5),
    ])
    setMetrics(metricsData)
    setTopProducts(productsData)
    setIsLoading(false)
  }

  function handleDateChange(field: 'startDate' | 'endDate', value: string) {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* PIN Protection Modal */}
      {!isAuthenticated && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="bg-indigo-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Lock className="h-10 w-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">حماية التقارير</h2>
              <p className="text-slate-600">أدخل رمز المرور للوصول إلى التقارير والتحليلات</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="أدخل رمز المرور"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest"
                  maxLength={4}
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                  {pinError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                دخول
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content - Only shown when authenticated */}
      {isAuthenticated && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">التقارير والتحليلات</h1>
          </div>

          {/* Date Filter */}
          <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">تصفية حسب التاريخ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">
                  من تاريخ
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">جاري تحميل البيانات...</div>
          ) : (
            <>
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-slate-900 rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">إجمالي الإيرادات</h3>
                  <p className="text-2xl font-bold text-white">{formatCurrency(metrics.totalRevenue, 'USD')}</p>
                </div>

                {/* Total Cost */}
                <div className="bg-slate-900 rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <Package className="h-6 w-6 text-red-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">إجمالي التكلفة</h3>
                  <p className="text-2xl font-bold text-white">{formatCurrency(metrics.totalCost, 'USD')}</p>
                </div>

                {/* Net Profit */}
                <div className="bg-slate-900 rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">صافي الربح</h3>
                  <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(metrics.netProfit, 'USD')}
                  </p>
                </div>

                {/* Total Sales */}
                <div className="bg-slate-900 rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">إجمالي المبيعات</h3>
                  <p className="text-2xl font-bold text-white">{metrics.totalSales}</p>
                  <p className="text-sm text-slate-400 mt-1">{metrics.totalItemsSold} منتج مبيع</p>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-slate-900 rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">أكثر المنتجات مبيعاً</h3>
                </div>
                {topProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">لا توجد بيانات</div>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-400">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{product.name}</h4>
                            <p className="text-sm text-slate-400">{product.barcode}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white">{formatCurrency(product.totalRevenue, 'USD')}</p>
                          <p className="text-sm text-slate-400">{product.totalQuantity} قطعة</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}