"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFixedCosts, FixedCost } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
import {
    DollarSign,
    Calendar,
    CheckCircle,
    XCircle
} from "lucide-react";

export function FixedCostStatsCards() {
    const { data: costs, isLoading } = useFixedCosts();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
        );
    }

    const stats = calculateStats(costs || []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Total Monthly"
                value={stats.totalCount}
                subtitle={formatCurrency(stats.totalAmount)}
                icon={DollarSign}
                iconColor="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-50 dark:bg-blue-900/20"
            />

            <StatCard
                title="Active Costs"
                value={stats.activeCount}
                subtitle={formatCurrency(stats.activeAmount)}
                icon={CheckCircle}
                iconColor="text-green-600 dark:text-green-400"
                bgColor="bg-green-50 dark:bg-green-900/20"
            />

            <StatCard
                title="Inactive Costs"
                value={stats.inactiveCount}
                subtitle={formatCurrency(stats.inactiveAmount)}
                icon={XCircle}
                iconColor="text-gray-600 dark:text-gray-400"
                bgColor="bg-gray-50 dark:bg-gray-900/20"
            />

            <StatCard
                title="Next Due"
                value={stats.nextDueDay}
                subtitle="Day of Month"
                icon={Calendar}
                iconColor="text-purple-600 dark:text-purple-400"
                bgColor="bg-purple-50 dark:bg-purple-900/20"
                isDate
            />
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    isDate?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, iconColor, bgColor, isDate }: StatCardProps) {
    return (
        <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-foreground mb-1">
                        {isDate ? `Day ${value}` : value}
                    </p>
                    <p className="text-sm font-semibold text-muted-foreground">
                        {subtitle}
                    </p>
                </div>
                <div className={`p-3 rounded-lg ${bgColor}`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
            </div>
        </Card>
    );
}

function calculateStats(costs: FixedCost[]) {
    const stats = {
        totalCount: costs.length,
        totalAmount: 0,
        activeCount: 0,
        activeAmount: 0,
        inactiveCount: 0,
        inactiveAmount: 0,
        nextDueDay: '-' as string | number,
    };

    const today = new Date().getDate();
    let minDiff = 32;

    costs.forEach((cost) => {
        const amount = Number(cost.amount);
        stats.totalAmount += amount;

        if (cost.isActive) {
            stats.activeCount++;
            stats.activeAmount += amount;

            // Calculate next due day
            let diff = cost.dayOfMonth - today;
            if (diff < 0) diff += 30; // Rough approximation for next month

            if (diff < minDiff) {
                minDiff = diff;
                stats.nextDueDay = cost.dayOfMonth;
            }
        } else {
            stats.inactiveCount++;
            stats.inactiveAmount += amount;
        }
    });

    return stats;
}
