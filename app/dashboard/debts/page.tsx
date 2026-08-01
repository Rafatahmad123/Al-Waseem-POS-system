import { getDebts } from '@/app/actions/debts'
import DebtsManager from '@/components/debts/DebtsManager'

export default async function DebtsPage() {
  const initialDebts = await getDebts()

  return (
    <DebtsManager
      initialDebts={initialDebts ?? []}
    />
  )
}
