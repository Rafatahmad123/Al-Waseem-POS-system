import { getCustomerById, getCustomerLedger, deleteCustomer } from '@/app/actions/customers'
import { processDebtPayment, createManualDebt } from '@/app/actions/debtPayments'
import { redirect } from 'next/navigation'
import CustomerLedgerClient from './CustomerLedgerClient'

export default async function CustomerLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const customerId = resolvedParams.id

  const customer = await getCustomerById(customerId)
  const ledger = await getCustomerLedger(customerId)

  if (!customer) {
    redirect('/dashboard/customers')
  }

  async function handlePayment(formData: FormData) {
    'use server'
    const result = await processDebtPayment(formData)
    if (result.error) {
      throw new Error(result.error)
    }
    redirect(`/dashboard/customers/${customerId}`)
  }

  async function handleDebtCreation(formData: FormData) {
    'use server'
    const result = await createManualDebt(formData)
    if (result.error) {
      throw new Error(result.error)
    }
    redirect(`/dashboard/customers/${customerId}`)
  }

  async function handleDeleteCustomer() {
    'use server'
    const result = await deleteCustomer(customerId)
    if (result.error) {
      throw new Error(result.error)
    }
    redirect('/dashboard/customers')
  }

  return (
    <CustomerLedgerClient 
      customer={customer}
      ledger={ledger}
      handlePayment={handlePayment}
      handleDebtCreation={handleDebtCreation}
      handleDeleteCustomer={handleDeleteCustomer}
    />
  )
}
