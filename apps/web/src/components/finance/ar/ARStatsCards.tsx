"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountsReceivable, AccountReceivable } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
import {
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    FileText
} from "lucide-react";

export function ARStatsCards() {
    const { data: accounts, isLoading } = useAccountsReceivable();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
        );
    }

    const stats = calculateStats(accounts || []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Total Receivable"
                value={stats.totalCount}
                subtitle={formatCurrency(stats.totalAmount)}
                icon={FileText}
                iconColor="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-50 dark:bg-blue-900/20"
            />

            <StatCard
                title="Pending"
                value={stats.pendingCount}
                subtitle={formatCurrency(stats.pendingAmount)}
                icon={Clock}
                iconColor="text-yellow-600 dark:text-yellow-400"
                bgColor="bg-yellow-50 dark:bg-yellow-900/20"
            />

            <StatCard
                title="Paid"
                value={stats.paidCount}
                subtitle={formatCurrency(stats.paidAmount)}
                icon={CheckCircle}
                iconColor="text-green-600 dark:text-green-400"
                bgColor="bg-green-50 dark:bg-green-900/20"
            />

            <StatCard
                title="Overdue"
                value={stats.overdueCount}
                subtitle={formatCurrency(stats.overdueAmount)}
                icon={AlertCircle}
                iconColor="text-red-600 dark:text-red-400"
                bgColor="bg-red-50 dark:bg-red-900/20"
            />
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
}

function StatCard({ title, value, subtitle, icon: Icon, iconColor, bgColor }: StatCardProps) {
    return (
        <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-foreground mb-1">
                        {value}
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

function calculateStats(accounts: AccountReceivable[]) {
    const stats = {
        totalCount: accounts.length,
        totalAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
        partialCount: 0,
        partialAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        overdueCount: 0,
        overdueAmount: 0,
        cancelledCount: 0,
        cancelledAmount: 0,
    };

    accounts.forEach((account) => {
        const amount = Number(account.monto);
        const remaining = Number(account.montoRestante);
        stats.totalAmount += amount;

        switch (account.status) {
            case 'PENDING':
                stats.pendingCount++;
                stats.pendingAmount += remaining;
                break;
            case 'PARTIAL':
                stats.partialCount++;
                stats.partialAmount += remaining;
                break;
            case 'PAID':
                stats.paidCount++;
                stats.paidAmount += amount;
                break;
            case 'OVERDUE':
                stats.overdueCount++;
                stats.overdueAmount += remaining;
                break;
            case 'CANCELLED':
                stats.cancelledCount++;
                stats.cancelledAmount += amount;
                break;
        }
    });

    return stats;
}
