import { getSaleById } from '@/app/actions/sales'
import SaleDetailClient from './SaleDetailClient'

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const saleId = resolvedParams.id

  const sale = await getSaleById(saleId)

  if (!sale) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600">لم يتم العثور على البيع</p>
      </div>
    )
  }

  return <SaleDetailClient sale={sale} />
}
