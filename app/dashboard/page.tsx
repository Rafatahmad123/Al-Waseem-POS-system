import { getDashboardStats, getCriticalExpiringProducts } from '@/app/actions/analytics'
import { Package, AlertTriangle, TrendingDown, Plus } from 'lucide-react'
import Link from 'next/link'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart'
import ExpiryAlerts from '@/components/dashboard/ExpiryAlerts'
import SensitiveStatsCards from '@/components/dashboard/SensitiveStatsCards'

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const expiringProducts = await getCriticalExpiringProducts()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          لوحة التحكم
        </h1>
        <p className="text-slate-600 mt-2 text-lg">نظرة عامة على أداء عملك</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <Link
          href="/dashboard/sales"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">بيع جديد</span>
        </Link>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">إضافة منتج</span>
        </Link>
        <Link
          href="/dashboard/expenses/new"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">تسجيل مصروف</span>
        </Link>
      </div>

      {/* Sensitive Financial Stats - Protected by AdminGate */}
      <SensitiveStatsCards
        todaySalesUSD={stats.todaySales?.totalUSD ?? 0}
        todayNetProfit={stats.todayNetProfit ?? 0}
        monthNetProfit={stats.monthNetProfit ?? 0}
      />

      {/* Low Stock Alert - Always visible (non-sensitive) */}
      <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
              <TrendingDown className="h-4 w-4" />
              <span>-3%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">منتجات منخفضة المخزون</p>
          <p className="text-3xl font-bold text-slate-900">{stats.lowStockItems?.length ?? 0}</p>
        </div>
      </div>

      {/* Expiry Alerts */}
      <ExpiryAlerts expiringProducts={expiringProducts} />

      {/* Sales Trend Chart */}
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">اتجاه المبيعات</h3>
        <SalesTrendChart data={Array.isArray(stats?.salesTrend) ? stats.salesTrend : []} />
      </div>

      {/* Low Stock Items */}
      {Array.isArray(stats?.lowStockItems) && stats.lowStockItems.length > 0 && (
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">تنبيه انخفاض المخزون</h3>
            <Link
              href="/dashboard/products"
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              عرض جميع المنتجات
            </Link>
          </div>
          <div className="space-y-3">
            {stats.lowStockItems.slice(0, 5).map((item: any, index: number) => (
              <div key={item?.id ?? `stock-${index}`} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div>
                  <p className="font-semibold text-slate-900">{item?.name ?? 'غير معروف'}</p>
                  <p className="text-sm text-slate-600">{item?.barcode ?? 'غير متوفر'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600 text-lg">{item?.current_stock ?? 0} متبقي</p>
                </div>
              </div>
            ))}
            {stats.lowStockItems.length > 5 && (
              <p className="text-center text-sm text-slate-600 py-2">
                و {stats.lowStockItems.length - 5} منتجات أخرى...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
