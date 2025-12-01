
'use client'

import { useFlowRecoveries, FlowRecovery } from '@/hooks/useFinance'
import { Card } from '@/components/ui/card'
import FinancialGuard from '@/components/guards/FinancialGuard'
import Loader from '@/components/ui/loader'
import { formatCurrency } from '@/lib/utils'

export default function FlowRecoveriesPage() {
    const { data: recoveries, isLoading } = useFlowRecoveries()

    return (
        <FinancialGuard>
            <div className="space-y-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Flow Recoveries</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Track money flow recoveries</p>
                    </div>
                </div>

                <Card className="p-0 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12">
                            <Loader size="lg" text="Loading recoveries..." />
                        </div>
                    ) : !recoveries || recoveries.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No flow recoveries found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Period</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Initial Amount</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Recovered</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">%</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {recoveries.map((recovery: FlowRecovery) => (
                                        <tr key={recovery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{recovery.periodo}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{recovery.client?.nombre || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                                                {formatCurrency(Number(recovery.montoInicial))}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                                                {formatCurrency(Number(recovery.recuperacionesReales))}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                                                {Number(recovery.porcentajeRecuperado).toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={recovery.notas}>
                                                {recovery.notas || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </FinancialGuard>
    )
}
