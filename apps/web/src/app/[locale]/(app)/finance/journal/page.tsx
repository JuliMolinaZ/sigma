'use client'

import { Card } from '@/components/ui/card'
import FinancialGuard from '@/components/guards/FinancialGuard'
import { FileText, Plus } from 'lucide-react'
import Button from '@/components/ui/button'
import { useJournalEntries, JournalEntry } from '@/hooks/useFinance'
import Loader from '@/components/ui/loader'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default function FinanceJournalPage() {
    const { data: entries, isLoading } = useJournalEntries()

    return (
        <FinancialGuard>
            <div className="space-y-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Journal Entries</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Record and manage financial transactions</p>
                    </div>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Entry
                    </Button>
                </div>

                <Card className="p-0 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12">
                            <Loader size="lg" text="Loading journal entries..." />
                        </div>
                    ) : !entries || entries.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                No Journal Entries Found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                Start by creating a new journal entry to record financial transactions.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reference</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Debit</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Credit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {entries.map((entry: JournalEntry) => {
                                        const totalDebit = entry.items?.reduce((sum, item) => sum + Number(item.debit), 0) || 0;
                                        const totalCredit = entry.items?.reduce((sum, item) => sum + Number(item.credit), 0) || 0;

                                        return (
                                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDate(entry.date)}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{entry.description}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{entry.reference || '-'}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <Badge variant={entry.status === 'POSTED' ? 'default' : 'secondary'}>
                                                        {entry.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(totalDebit)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(totalCredit)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </FinancialGuard>
    )
}
