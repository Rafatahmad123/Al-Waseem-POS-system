import { getProducts } from '@/app/actions/products'
import SalesManager from '@/components/sales/SalesManager'

export default async function NewSalePage() {
  const initialProducts = await getProducts()

  return <SalesManager initialProducts={initialProducts} />
}
