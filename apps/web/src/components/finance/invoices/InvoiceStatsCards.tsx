"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useInvoices, Invoice } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
import {
    FileText,
    Send,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { KPICard } from "@/components/ui/kpi-card";

export function InvoiceStatsCards() {
    const { data: invoices, isLoading } = useInvoices();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
        );
    }

    const stats = calculateStats(invoices || []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
                title="Total Invoiced"
                value={formatCurrency(stats.totalAmount)}
                icon={FileText}
                trend={{ value: stats.totalCount, label: "invoices", direction: "neutral" }}
                loading={isLoading}
            />

            <KPICard
                title="Sent / Pending"
                value={formatCurrency(stats.sentAmount)}
                icon={Send}
                trend={{ value: stats.sentCount, label: "pending", direction: "neutral" }}
                loading={isLoading}
                className="border-l-4 border-l-yellow-500"
            />

            <KPICard
                title="Paid"
                value={formatCurrency(stats.paidAmount)}
                icon={CheckCircle}
                trend={{ value: stats.paidCount, label: "paid invoices", direction: "up" }}
                loading={isLoading}
                className="border-l-4 border-l-green-500"
            />

            <KPICard
                title="Overdue"
                value={formatCurrency(stats.overdueAmount)}
                icon={AlertCircle}
                trend={{ value: stats.overdueCount, label: "overdue invoices", direction: "down" }}
                loading={isLoading}
                className="border-l-4 border-l-red-500"
            />
        </div>
    );
}

function calculateStats(invoices: Invoice[]) {
    const stats = {
        totalCount: invoices.length,
        totalAmount: 0,
        sentCount: 0,
        sentAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        overdueCount: 0,
        overdueAmount: 0,
        draftCount: 0,
        draftAmount: 0,
        cancelledCount: 0,
        cancelledAmount: 0,
    };

    invoices.forEach((invoice) => {
        const amount = Number(invoice.amount);

        // Don't count cancelled in total amount
        if (invoice.status !== 'CANCELLED') {
            stats.totalAmount += amount;
        }

        switch (invoice.status) {
            case 'SENT':
                stats.sentCount++;
                stats.sentAmount += amount;
                break;
            case 'PAID':
                stats.paidCount++;
                stats.paidAmount += amount;
                break;
            case 'OVERDUE':
                stats.overdueCount++;
                stats.overdueAmount += amount;
                break;
            case 'DRAFT':
                stats.draftCount++;
                stats.draftAmount += amount;
                break;
            case 'CANCELLED':
                stats.cancelledCount++;
                stats.cancelledAmount += amount;
                break;
        }
    });

    return stats;
}
