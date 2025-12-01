'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import AccessDenied from '@/components/ui/access-denied'
import { checkModuleAccess } from '@/lib/constants'
import { ExpenseDetailsPanel } from '@/components/finance/expenses/ExpenseDetailsPanel'

export default function ExpenseDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuthStore()

    const expenseId = params.id as string

    if (!checkModuleAccess('expenses', user)) {
        return <AccessDenied />
    }

    return (
        <div className="h-[calc(100vh-4rem)]">
            <ExpenseDetailsPanel
                expenseId={expenseId}
                onClose={() => router.push('/expenses')}
            />
        </div>
    )
}
