import { getProducts, getCategories } from '@/app/actions/products'
import ProductsManager from '@/components/products/ProductsManager'

export default async function ProductsPage() {
  const initialProducts = await getProducts()
  const initialCategories = await getCategories()

  return (
    <ProductsManager
      initialProducts={initialProducts ?? []}
      initialCategories={initialCategories ?? []}
    />
  )
}
