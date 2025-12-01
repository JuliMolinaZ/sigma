'use client'

import { Card } from '@/components/ui/card'
import FinancialGuard from '@/components/guards/FinancialGuard'
import { BarChart3, Plus } from 'lucide-react'
import Button from '@/components/ui/button'

export default function FinanceReportsPage() {
    return (
        <FinancialGuard>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Financial Reports</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Generate and view financial statements</p>
                    </div>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Report
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="text-center p-6">
                        <BarChart3 className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Income Statement</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Revenue, expenses, and profit/loss</p>
                    </Card>

                    <Card className="text-center p-6">
                        <BarChart3 className="w-12 h-12 mx-auto text-green-600 dark:text-green-400 mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Balance Sheet</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Assets, liabilities, and equity</p>
                    </Card>

                    <Card className="text-center p-6">
                        <BarChart3 className="w-12 h-12 mx-auto text-purple-600 dark:text-purple-400 mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Cash Flow</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Operating, investing, and financing activities</p>
                    </Card>
                </div>

                <Card className="text-center py-12 p-6">
                    <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Financial Reports Module
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Generate comprehensive financial reports including income statements, balance sheets, and cash flow statements.
                    </p>
                </Card>
            </div>
        </FinancialGuard>
    )
}
