"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuotes, Quote } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
import {
    FileText,
    Send,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";

export function QuoteStatsCards() {
    const { data: quotes, isLoading } = useQuotes();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
        );
    }

    const stats = calculateStats(quotes || []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Total Quotes"
                value={stats.totalCount}
                subtitle={formatCurrency(stats.totalAmount)}
                icon={FileText}
                iconColor="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-50 dark:bg-blue-900/20"
            />

            <StatCard
                title="Pending / Sent"
                value={stats.pendingCount}
                subtitle={formatCurrency(stats.pendingAmount)}
                icon={Clock}
                iconColor="text-yellow-600 dark:text-yellow-400"
                bgColor="bg-yellow-50 dark:bg-yellow-900/20"
            />

            <StatCard
                title="Accepted"
                value={stats.acceptedCount}
                subtitle={formatCurrency(stats.acceptedAmount)}
                icon={CheckCircle}
                iconColor="text-green-600 dark:text-green-400"
                bgColor="bg-green-50 dark:bg-green-900/20"
            />

            <StatCard
                title="Rejected / Expired"
                value={stats.rejectedCount}
                subtitle={formatCurrency(stats.rejectedAmount)}
                icon={XCircle}
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

function calculateStats(quotes: Quote[]) {
    const stats = {
        totalCount: quotes.length,
        totalAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
        acceptedCount: 0,
        acceptedAmount: 0,
        rejectedCount: 0,
        rejectedAmount: 0,
    };

    quotes.forEach((quote) => {
        const amount = Number(quote.amount);
        stats.totalAmount += amount;

        switch (quote.status) {
            case 'DRAFT':
            case 'SENT':
                stats.pendingCount++;
                stats.pendingAmount += amount;
                break;
            case 'ACCEPTED':
                stats.acceptedCount++;
                stats.acceptedAmount += amount;
                break;
            case 'REJECTED':
            case 'EXPIRED':
                stats.rejectedCount++;
                stats.rejectedAmount += amount;
                break;
        }
    });

    return stats;
}
