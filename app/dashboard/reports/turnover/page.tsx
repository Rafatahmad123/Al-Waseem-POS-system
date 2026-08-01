'use client'

import { useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Filter, Package } from 'lucide-react'
import Link from 'next/link'
import { getProductTurnover } from '@/app/actions/analytics'

export default function TurnoverReportPage() {
  const [days, setDays] = useState(30)
  const [turnoverData, setTurnoverData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTurnoverData = async (period: number) => {
    setLoading(true)
    const data = await getProductTurnover(period)
    setTurnoverData(data)
    setLoading(false)
  }

  const handlePeriodChange = (period: number) => {
    setDays(period)
    fetchTurnoverData(period)
  }

  // Fetch initial data
  useState(() => {
    fetchTurnoverData(30)
  })

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'Fast':
        return 'bg-green-100 border-green-500 text-green-800'
      case 'Normal':
        return 'bg-blue-100 border-blue-500 text-blue-800'
      case 'Slow':
        return 'bg-red-100 border-red-500 text-red-800'
      default:
        return 'bg-slate-100 border-slate-500 text-slate-800'
    }
  }

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'Fast':
        return <TrendingUp className="h-4 w-4" />
      case 'Normal':
        return <Minus className="h-4 w-4" />
      case 'Slow':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getSpeedText = (speed: string) => {
    switch (speed) {
      case 'Fast':
        return 'سريع'
      case 'Normal':
        return 'عادي'
      case 'Slow':
        return 'بطيء'
      default:
        return speed
    }
  }

  const fastCount = turnoverData.filter(p => p.movement_speed === 'Fast').length
  const normalCount = turnoverData.filter(p => p.movement_speed === 'Normal').length
  const slowCount = turnoverData.filter(p => p.movement_speed === 'Slow').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">تقرير دوران المخزون</h2>
          <p className="text-slate-600 mt-1">تحليل سرعة حركة المنتجات</p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">فترة التحليل:</span>
          <div className="flex gap-2">
            {[7, 30, 90].map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  days === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                آخر {period} يوم
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">منتجات سريعة الحركة</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{fastCount}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">منتجات عادية الحركة</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{normalCount}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <Minus className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">منتجات بطيئة الحركة</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{slowCount}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-full">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Turnover Table */}
      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              تفاصيل دوران المخزون (آخر {days} يوم)
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">جاري تحميل البيانات...</p>
          </div>
        ) : turnoverData.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">لا توجد بيانات دوران المخزون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    المنتج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الباركود
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الفئة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    المخزون الحالي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الكميات المباعة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    معدل الدوران
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    سرعة الحركة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {turnoverData.map((product) => (
                  <tr key={product.product_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{product.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {product.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {product.current_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {product.total_sold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {product.turnover_rate}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getSpeedColor(product.movement_speed)}`}>
                        {getSpeedIcon(product.movement_speed)}
                        {getSpeedText(product.movement_speed)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {turnoverData.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">توصيات إعادة التخزين</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            {fastCount > 0 && (
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">•</span>
                <span>فكر في زيادة المخزون للمنتجات السريعة الحركة ({fastCount} منتج) لتجنب نفاد المخزون</span>
              </li>
            )}
            {slowCount > 0 && (
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">•</span>
                <span>قلل المخزون أو قدم خصومات للمنتجات البطيئة الحركة ({slowCount} منتج) لتقليل تكاليف التخزين</span>
              </li>
            )}
            {normalCount > 0 && (
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">•</span>
                <span>حافظ على مستويات المخزون الحالية للمنتجات العادية الحركة ({normalCount} منتج)</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
