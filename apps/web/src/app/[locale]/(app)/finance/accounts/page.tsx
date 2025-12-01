'use client'

import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loader from '@/components/ui/loader'
import FinancialGuard from '@/components/guards/FinancialGuard'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface Account {
    id: string
    code: string
    name: string
    type: string
    balance: number
    parentId?: string
}

export default function FinanceAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await api.get<{ success: boolean, data: Account[] }>('/finance/accounts')
                setAccounts(response.data.data || [])
            } catch (error: any) {
                // Only log errors that aren't 403/404 (permission or endpoint issues)
                if (error?.response?.status !== 403 && error?.response?.status !== 404) {
                    console.error('Failed to fetch accounts:', error)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchAccounts()
    }, [])

    return (
        <FinancialGuard>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Chart of Accounts</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your financial accounts</p>
                    </div>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Account
                    </Button>
                </div>

                <Card className="p-0 overflow-hidden">
                    {loading ? (
                        <div className="p-12">
                            <Loader size="lg" text="Loading accounts..." />
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {accounts.map((account) => (
                                        <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{account.code}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{account.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{account.type}</td>
                                            <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(account.balance)}
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
