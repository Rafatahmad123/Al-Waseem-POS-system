'use client'

import { Trash2 } from 'lucide-react'

interface DeleteExpenseButtonProps {
  expenseId: string
}

export default function DeleteExpenseButton({ expenseId }: DeleteExpenseButtonProps) {
  const handleClick = (e: React.FormEvent) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      e.preventDefault()
    }
  }

  return (
    <button
      type="submit"
      className="text-red-600 hover:text-red-900"
      onClick={handleClick}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
