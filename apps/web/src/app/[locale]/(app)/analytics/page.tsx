'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Clock, DollarSign, Activity } from 'lucide-react'

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Insights and performance metrics</p>
                </div>
                <div className="flex gap-2">
                    {(['week', 'month', 'year'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Project Completion</h3>
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">87%</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">+12% from last {timeRange}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Productivity</h3>
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">94%</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">+5% from last {timeRange}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Response Time</h3>
                        <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">2.4h</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">-18% from last {timeRange}</p>
                </Card>
            </div>

            <Card className="text-center py-12 p-6">
                <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Advanced Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Detailed charts and visualizations will be displayed here. Connect your data sources to see comprehensive analytics.
                </p>
            </Card>
        </div>
    )
}
