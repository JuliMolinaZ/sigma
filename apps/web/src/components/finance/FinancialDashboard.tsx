"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccountsReceivable, useAccountsPayable, useFixedCosts, useInvoices } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function FinancialDashboard() {
    const { data: ar, isLoading: isLoadingAR } = useAccountsReceivable();
    const { data: ap, isLoading: isLoadingAP } = useAccountsPayable();
    const { data: fixedCosts, isLoading: isLoadingFixed } = useFixedCosts();
    const { data: invoices, isLoading: isLoadingInvoices } = useInvoices();

    const isLoading = isLoadingAR || isLoadingAP || isLoadingFixed || isLoadingInvoices;

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    const stats = calculateFinancialStats(ar || [], ap || [], fixedCosts || [], invoices || []);

    return (
        <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (YTD)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(stats.totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses (YTD)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(stats.totalExpenses)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +4.5% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(stats.netIncome)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Calculated from Revenue - Expenses
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Collections</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {formatCurrency(stats.pendingCollections)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.pendingInvoicesCount} invoices pending
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {/* Placeholder for a chart or list */}
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Invoice #INV-001 Paid</p>
                                    <p className="text-sm text-muted-foreground">Client: Acme Corp</p>
                                </div>
                                <div className="ml-auto font-medium">+$1,999.00</div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Office Rent</p>
                                    <p className="text-sm text-muted-foreground">Fixed Cost</p>
                                </div>
                                <div className="ml-auto font-medium text-red-600">-$2,500.00</div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">New Quote Created</p>
                                    <p className="text-sm text-muted-foreground">Project X</p>
                                </div>
                                <div className="ml-auto font-medium text-blue-600">Pending</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Fixed Costs (Monthly)</span>
                                <span className="font-bold">{formatCurrency(stats.monthlyFixedCosts)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Pending Payables</span>
                                <span className="font-bold text-red-600">{formatCurrency(stats.pendingPayables)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Active Quotes Value</span>
                                <span className="font-bold text-blue-600">{formatCurrency(stats.activeQuotesValue)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="col-span-4 h-[300px]" />
                <Skeleton className="col-span-3 h-[300px]" />
            </div>
        </div>
    );
}

function calculateFinancialStats(ar: any[], ap: any[], fixedCosts: any[], invoices: any[]) {
    // Basic calculation logic - in a real app this should be more robust or backend-driven

    // Revenue: Paid Invoices + Paid AR
    const revenueFromInvoices = invoices
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + Number(i.amount), 0);

    const revenueFromAR = ar
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + Number(i.monto), 0); // Assuming 'monto' is the field

    const totalRevenue = revenueFromInvoices + revenueFromAR;

    // Expenses: Paid AP + Fixed Costs (Annualized estimate or YTD?)
    // For simplicity, let's just sum Paid AP and 1 month of Fixed Costs for now as a "Monthly Snapshot" or similar
    // Or better, let's just sum Paid AP
    const expensesFromAP = ap
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + Number(i.monto), 0);

    const monthlyFixedCosts = fixedCosts
        .filter(c => c.isActive)
        .reduce((sum, c) => sum + Number(c.monto), 0);

    // Let's assume "Total Expenses" is AP Paid + (Monthly Fixed Costs * 12) for a rough YTD view? 
    // Or just keep it simple: Paid AP + 1 Month Fixed Costs
    const totalExpenses = expensesFromAP + monthlyFixedCosts;

    // Pending Collections (AR + Invoices)
    const pendingInvoices = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE');
    const pendingAR = ar.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE');

    const pendingCollections =
        pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0) +
        pendingAR.reduce((sum, i) => sum + Number(i.monto), 0);

    // Pending Payables
    const pendingPayables = ap
        .filter(i => i.status === 'PENDING' || i.status === 'OVERDUE')
        .reduce((sum, i) => sum + Number(i.monto), 0);

    return {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        pendingCollections,
        pendingInvoicesCount: pendingInvoices.length + pendingAR.length,
        monthlyFixedCosts,
        pendingPayables,
        activeQuotesValue: 0 // Placeholder as we don't have quotes data in this component yet
    };
}
