'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskDashboardStats } from '@/types'
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    BarChart3,
    ListTodo,
    TrendingUp,
    Zap,
    Target,
    Activity,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import Badge from '@/components/ui/badge'

interface TaskDashboardProps {
    stats: TaskDashboardStats
}

export default function TaskDashboard({ stats }: TaskDashboardProps) {
    const { totalTasks, tasksByStatus = {}, tasksByPriority = {}, overdueTasks } = stats || {}

    const completionRate = totalTasks > 0 ? ((tasksByStatus['DONE'] || 0) / totalTasks) * 100 : 0
    const inProgressCount = tasksByStatus['IN_PROGRESS'] || 0
    const todoCount = tasksByStatus['TODO'] || 0
    const activeTasksCount = inProgressCount + todoCount

    const priorityStats = [
        {
            label: 'Critical',
            count: tasksByPriority['CRITICAL'] || 0,
            color: 'bg-red-500',
            lightColor: 'bg-red-100 dark:bg-red-950/30',
            textColor: 'text-red-600 dark:text-red-400',
        },
        {
            label: 'Urgent',
            count: tasksByPriority['URGENT'] || 0,
            color: 'bg-orange-500',
            lightColor: 'bg-orange-100 dark:bg-orange-950/30',
            textColor: 'text-orange-600 dark:text-orange-400',
        },
        {
            label: 'High',
            count: tasksByPriority['HIGH'] || 0,
            color: 'bg-yellow-500',
            lightColor: 'bg-yellow-100 dark:bg-yellow-950/30',
            textColor: 'text-yellow-600 dark:text-yellow-400',
        },
        {
            label: 'Medium',
            count: tasksByPriority['MEDIUM'] || 0,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-100 dark:bg-blue-950/30',
            textColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Low',
            count: tasksByPriority['LOW'] || 0,
            color: 'bg-gray-500',
            lightColor: 'bg-gray-100 dark:bg-gray-950/30',
            textColor: 'text-gray-600 dark:text-gray-400',
        },
    ]

    const mainStats = [
        {
            title: 'Total Tasks',
            value: totalTasks,
            icon: ListTodo,
            color: 'bg-gradient-to-br from-blue-500 to-blue-700',
            lightBg: 'bg-blue-50 dark:bg-blue-950/20',
            description: 'All tasks across projects',
            trend: null,
        },
        {
            title: 'Completed',
            value: tasksByStatus['DONE'] || 0,
            icon: CheckCircle2,
            color: 'bg-gradient-to-br from-green-500 to-green-700',
            lightBg: 'bg-green-50 dark:bg-green-950/20',
            description: `${completionRate.toFixed(0)}% completion rate`,
            trend: 'up',
        },
        {
            title: 'In Progress',
            value: inProgressCount,
            icon: Activity,
            color: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
            lightBg: 'bg-yellow-50 dark:bg-yellow-950/20',
            description: 'Currently active',
            trend: null,
        },
        {
            title: 'Overdue',
            value: overdueTasks,
            icon: AlertCircle,
            color: 'bg-gradient-to-br from-red-500 to-red-700',
            lightBg: 'bg-red-50 dark:bg-red-950/20',
            description: 'Requires immediate attention',
            trend: overdueTasks > 0 ? 'down' : null,
            alert: overdueTasks > 0,
        },
    ]

    return (
        <div className="space-y-3 mb-3">
            {/* Main Stats Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {mainStats.map((stat, index) => (
                    <Card
                        key={index}
                        className={cn(
                            'relative overflow-hidden border transition-all duration-300',
                            'hover:shadow-lg hover:scale-[1.01]',
                            stat.alert && 'border-red-500/50'
                        )}
                    >
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        {stat.title}
                                    </p>
                                    <div className="text-2xl font-black text-gray-900 dark:text-gray-100">
                                        {stat.value}
                                    </div>
                                </div>
                                <div className={cn('p-1.5 rounded-md', stat.color)}>
                                    <stat.icon className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        </CardContent>
                        <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', stat.color)} />
                    </Card>
                ))}
            </div>

        </div>
    )
}
