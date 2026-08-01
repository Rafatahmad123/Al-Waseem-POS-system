import { getCategories } from '@/app/actions/categories'
import CategoriesManager from '@/components/categories/CategoriesManager'

export default async function CategoriesPage() {
  const initialCategories = await getCategories()

  return <CategoriesManager initialCategories={initialCategories} />
}
