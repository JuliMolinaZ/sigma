'use client'

import { cn } from '@/lib/utils'
import { AlertCircle, ArrowUp, ArrowDown, Minus, Zap } from 'lucide-react'

export type Priority = 'CRITICAL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'

interface PriorityIndicatorProps {
    priority: Priority
    variant?: 'default' | 'dot' | 'badge' | 'card'
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    className?: string
}

const priorityConfig = {
    CRITICAL: {
        label: 'Critical',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-900',
        ring: 'ring-red-500/20',
        glow: 'shadow-red-500/50',
        icon: Zap,
        gradient: 'from-red-500 to-red-700',
    },
    URGENT: {
        label: 'Urgent',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-200 dark:border-orange-900',
        ring: 'ring-orange-500/20',
        glow: 'shadow-orange-500/50',
        icon: AlertCircle,
        gradient: 'from-orange-500 to-orange-700',
    },
    HIGH: {
        label: 'High',
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        border: 'border-yellow-200 dark:border-yellow-900',
        ring: 'ring-yellow-500/20',
        glow: 'shadow-yellow-500/50',
        icon: ArrowUp,
        gradient: 'from-yellow-500 to-yellow-700',
    },
    MEDIUM: {
        label: 'Medium',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-900',
        ring: 'ring-blue-500/20',
        glow: 'shadow-blue-500/50',
        icon: Minus,
        gradient: 'from-blue-500 to-blue-700',
    },
    LOW: {
        label: 'Low',
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-950/30',
        border: 'border-gray-200 dark:border-gray-900',
        ring: 'ring-gray-500/20',
        glow: 'shadow-gray-500/50',
        icon: ArrowDown,
        gradient: 'from-gray-500 to-gray-700',
    },
}

export default function PriorityIndicator({
    priority,
    variant = 'badge',
    size = 'md',
    showLabel = true,
    className,
}: PriorityIndicatorProps) {
    const config = priorityConfig[priority]
    const Icon = config.icon

    const sizeClasses = {
        sm: 'text-xs px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-3 py-1.5',
    }

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    }

    if (variant === 'dot') {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <div className="relative">
                    <div
                        className={cn(
                            'w-2 h-2 rounded-full',
                            config.bg,
                            config.border,
                            'border'
                        )}
                    />
                    {priority === 'CRITICAL' && (
                        <div
                            className={cn(
                                'absolute inset-0 w-2 h-2 rounded-full animate-ping',
                                config.bg
                            )}
                        />
                    )}
                </div>
                {showLabel && (
                    <span className={cn('text-sm font-medium', config.color)}>
                        {config.label}
                    </span>
                )}
            </div>
        )
    }

    if (variant === 'badge') {
        return (
            <div
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-full font-semibold transition-all',
                    config.bg,
                    config.color,
                    config.border,
                    'border',
                    sizeClasses[size],
                    priority === 'CRITICAL' && 'animate-pulse',
                    className
                )}
            >
                <Icon className={iconSizes[size]} />
                {showLabel && <span>{config.label}</span>}
            </div>
        )
    }

    if (variant === 'card') {
        return (
            <div
                className={cn(
                    'relative overflow-hidden rounded-lg p-3 transition-all hover:scale-105',
                    config.bg,
                    config.border,
                    'border-2',
                    'group cursor-pointer',
                    className
                )}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'p-2 rounded-lg bg-gradient-to-br',
                            config.gradient,
                            'text-white'
                        )}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className={cn('font-bold text-sm', config.color)}>
                            {config.label}
                        </p>
                        <p className="text-xs text-muted-foreground">Priority</p>
                    </div>
                </div>
                {priority === 'CRITICAL' && (
                    <div
                        className={cn(
                            'absolute inset-0 bg-gradient-to-r',
                            config.gradient,
                            'opacity-0 group-hover:opacity-10 transition-opacity'
                        )}
                    />
                )}
            </div>
        )
    }

    // default variant
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5',
                config.color,
                className
            )}
        >
            <Icon className={iconSizes[size]} />
            {showLabel && <span className="text-sm font-medium">{config.label}</span>}
        </div>
    )
}
