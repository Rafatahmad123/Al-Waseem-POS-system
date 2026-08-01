import { getProducts } from '@/app/actions/products'
import { getSuppliers } from '@/app/actions/suppliers'
import PurchasesManager from '@/components/purchases/PurchasesManager'

export default async function PurchasesPage() {
  const initialProducts = await getProducts()
  const initialSuppliers = await getSuppliers()

  return (
    <PurchasesManager
      initialProducts={initialProducts}
      initialSuppliers={initialSuppliers}
    />
  )
}
