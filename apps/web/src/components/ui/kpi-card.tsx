import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

interface KPICardProps {
    title: string
    value: string | number
    icon: React.ElementType
    trend?: {
        value: number
        label: string
        direction: 'up' | 'down' | 'neutral'
    }
    className?: string
    loading?: boolean
}

export function KPICard({ title, value, icon: Icon, trend, className, loading }: KPICardProps) {
    if (loading) {
        return (
            <Card className={cn("overflow-hidden", className)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                    <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {trend.direction === 'up' && <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />}
                        {trend.direction === 'down' && <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />}
                        {trend.direction === 'neutral' && <MinusIcon className="mr-1 h-4 w-4" />}
                        <span className={cn(
                            trend.direction === 'up' && "text-green-500",
                            trend.direction === 'down' && "text-red-500",
                        )}>
                            {Math.abs(trend.value)}%
                        </span>
                        <span className="ml-1">{trend.label}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
