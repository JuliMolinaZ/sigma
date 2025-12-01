"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/utils";
import {
    DollarSign,
    Clock,
    CheckCircle,
    TrendingUp,
    XCircle,
    FileText
} from "lucide-react";
import { Expense } from "@/types";

export function ExpenseStatsCards() {
    const { data: expenses, isLoading } = useExpenses();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
        );
    }

    const stats = calculateStats(expenses || []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Total Expenses"
                value={stats.totalCount}
                subtitle={formatCurrency(stats.totalAmount)}
                icon={FileText}
                iconColor="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-50 dark:bg-blue-900/20"
            />

            <StatCard
                title="Pending Approval"
                value={stats.pendingCount}
                subtitle={formatCurrency(stats.pendingAmount)}
                icon={Clock}
                iconColor="text-yellow-600 dark:text-yellow-400"
                bgColor="bg-yellow-50 dark:bg-yellow-900/20"
            />

            <StatCard
                title="Approved"
                value={stats.approvedCount}
                subtitle={formatCurrency(stats.approvedAmount)}
                icon={CheckCircle}
                iconColor="text-green-600 dark:text-green-400"
                bgColor="bg-green-50 dark:bg-green-900/20"
            />

            <StatCard
                title="Reimbursed"
                value={stats.reimbursedCount}
                subtitle={formatCurrency(stats.reimbursedAmount)}
                icon={DollarSign}
                iconColor="text-purple-600 dark:text-purple-400"
                bgColor="bg-purple-50 dark:bg-purple-900/20"
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

function calculateStats(expenses: Expense[]) {
    const stats = {
        totalCount: expenses.length,
        totalAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
        approvedCount: 0,
        approvedAmount: 0,
        reimbursedCount: 0,
        reimbursedAmount: 0,
        rejectedCount: 0,
        rejectedAmount: 0,
    };

    expenses.forEach((expense) => {
        const amount = Number(expense.amount);
        stats.totalAmount += amount;

        switch (expense.status) {
            case 'SUBMITTED':
                stats.pendingCount++;
                stats.pendingAmount += amount;
                break;
            case 'APPROVED':
                stats.approvedCount++;
                stats.approvedAmount += amount;
                break;
            case 'REIMBURSED':
                stats.reimbursedCount++;
                stats.reimbursedAmount += amount;
                break;
            case 'REJECTED':
                stats.rejectedCount++;
                stats.rejectedAmount += amount;
                break;
        }
    });

    return stats;
}
