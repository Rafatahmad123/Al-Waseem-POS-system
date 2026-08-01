import { getSaleById } from '@/app/actions/sales'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/pricing'

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
  const sale = await getSaleById(params.id)

  if (!sale) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600">لم يتم العثور على البيع</p>
      </div>
    )
  }

  const saleDate = new Date(sale.sale_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/sales"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة للمبيعات
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer className="h-4 w-4" />
          طباعة الفاتورة
        </button>
      </div>

      {/* Invoice Container - A5 Layout */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-8 max-w-2xl mx-auto print:shadow-none print:border-none">
        {/* Invoice Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">نظام الواسيم للبيع</h1>
          <p className="text-slate-600 mt-1">فاتورة مبيعات</p>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <p className="font-semibold text-slate-900">رقم الفاتورة #</p>
            <p className="text-slate-600">{sale.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900">التاريخ</p>
            <p className="text-slate-600">{saleDate}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">طريقة الدفع</p>
            <p className="text-slate-600 capitalize">{sale.payment_method === 'cash' ? 'نقداً' : sale.payment_method || 'نقداً'}</p>
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900">الحالة</p>
            <p className="text-green-600 font-medium">مدفوع</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-right py-3 text-sm font-semibold text-slate-900">العنصر</th>
                <th className="text-center py-3 text-sm font-semibold text-slate-900">الكمية</th>
                <th className="text-left py-3 text-sm font-semibold text-slate-900">السعر</th>
                <th className="text-left py-3 text-sm font-semibold text-slate-900">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {sale.sale_items.map((item: any) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="py-3 text-sm text-slate-900">
                    {item.products?.name || 'منتج غير معروف'}
                    <p className="text-xs text-slate-600">{item.products?.barcode}</p>
                  </td>
                  <td className="py-3 text-center text-sm text-slate-900">{item.quantity}</td>
                  <td className="py-3 text-left text-sm text-slate-900">
                    ${item.selling_price_usd.toFixed(2)}
                  </td>
                  <td className="py-3 text-left text-sm text-slate-900">
                    ${(item.selling_price_usd * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="border-t-2 border-slate-300 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-slate-900">المجموع</span>
            <span className="text-2xl font-bold text-slate-900">
              ${sale.total_amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="mt-8 pt-4 border-t border-slate-200">
            <p className="font-semibold text-slate-900 text-sm mb-2">ملاحظات</p>
            <p className="text-sm text-slate-600">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-600">
          <p>شكراً لتعاملكم معنا!</p>
          <p className="mt-1">نظام الواسيم للبيع</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A5;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  )
}
