'use client'

import { LucideIcon } from 'lucide-react'
import { Card } from '../ui/card'
import { cn, formatNumber } from '@/lib/utils'

export interface StatsCardProps {
    title: string
    value: string | number
    change?: number
    icon: LucideIcon
    trend?: 'up' | 'down' | 'neutral'
    loading?: boolean
}

export default function StatsCard({
    title,
    value,
    change,
    icon: Icon,
    trend = 'neutral',
    loading
}: StatsCardProps) {
    const trendColors = {
        up: 'text-green-600 dark:text-green-400',
        down: 'text-red-600 dark:text-red-400',
        neutral: 'text-gray-600 dark:text-gray-400',
    }

    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    {loading ? (
                        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                            {typeof value === 'number' ? formatNumber(value) : value}
                        </p>
                    )}
                    {change !== undefined && !loading && (
                        <p className={cn('text-sm mt-2', trendColors[trend])}>
                            {change > 0 ? '+' : ''}{change}% from last month
                        </p>
                    )}
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        </Card>
    )
}
