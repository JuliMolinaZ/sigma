'use client'

import { FinancialDashboard } from '@/components/finance/FinancialDashboard'
import FinancialGuard from '@/components/guards/FinancialGuard'
import { useAuthStore } from '@/store/auth.store'
import AccessDenied from '@/components/ui/access-denied'
import { checkModuleAccess } from '@/lib/constants'
import { useTranslations } from 'next-intl'

export default function FinanceDashboardPage() {
    const { user } = useAuthStore()
    const t = useTranslations('financeDashboard')

    if (!checkModuleAccess('finance-dashboard', user)) {
        return <AccessDenied />
    }

    return (
        <FinancialGuard>
            <div className="space-y-6 p-8 pt-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
                </div>

                <FinancialDashboard />
            </div>
        </FinancialGuard>
    )
}
