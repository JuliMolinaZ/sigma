"use client";

import { useState, useMemo } from "react";
import { Plus, FileText, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuoteDataTable } from "@/components/finance/quotes/QuoteDataTable";
import { QuoteForm } from "@/components/finance/quotes/QuoteForm";
import { QuoteDetailsPanel } from "@/components/finance/quotes/QuoteDetailsPanel";
import { useQuotes, useCreateQuote, Quote } from "@/hooks/useFinance";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import AccessDenied from "@/components/ui/access-denied";
import { checkModuleAccess } from "@/lib/constants";
import { KPICard } from "@/components/ui/kpi-card";
import { formatCurrency } from "@/lib/utils";

export default function QuotesPage() {
    const { user } = useAuthStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { data: quotes = [], isLoading } = useQuotes({});
    const createQuote = useCreateQuote();

    const kpis = useMemo(() => {
        const totalQuoted = quotes
            .filter((q: Quote) => q.status !== 'REJECTED' && q.status !== 'EXPIRED')
            .reduce((sum: number, q: Quote) => sum + (q.amount || 0), 0);

        const acceptedValue = quotes
            .filter((q: Quote) => q.status === 'ACCEPTED')
            .reduce((sum: number, q: Quote) => sum + (q.amount || 0), 0);

        const acceptedCount = quotes
            .filter((q: Quote) => q.status === 'ACCEPTED')
            .length;

        const totalCount = quotes.length;
        const conversionRate = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;

        const pendingCount = quotes
            .filter((q: Quote) => q.status === 'DRAFT' || q.status === 'SENT')
            .length;

        return {
            totalQuoted,
            acceptedValue,
            acceptedCount,
            conversionRate,
            pendingCount
        };
    }, [quotes]);

    if (!checkModuleAccess("finance", user)) {
        return <AccessDenied />;
    }

    const handleCreate = async (data: any) => {
        try {
            await createQuote.mutateAsync(data);
            toast.success("Quote created successfully");
            setIsCreateOpen(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create quote");
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-none">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Quotes</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage and track client quotes
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Quote
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-none">
                <KPICard
                    title="Total Quoted"
                    value={formatCurrency(kpis.totalQuoted)}
                    icon={FileText}
                    trend={{ value: 15, label: "vs last month", direction: "up" }}
                    loading={isLoading}
                />
                <KPICard
                    title="Accepted Value"
                    value={formatCurrency(kpis.acceptedValue)}
                    icon={CheckCircle}
                    trend={{ value: kpis.acceptedCount, label: "accepted quotes", direction: "up" }}
                    loading={isLoading}
                    className="border-l-4 border-l-green-500"
                />
                <KPICard
                    title="Conversion Rate"
                    value={`${kpis.conversionRate.toFixed(1)}%`}
                    icon={TrendingUp}
                    trend={{ value: 5, label: "vs last month", direction: "up" }}
                    loading={isLoading}
                />
                <KPICard
                    title="Pending"
                    value={kpis.pendingCount.toString()}
                    icon={Clock}
                    trend={{ value: 0, label: "awaiting response", direction: "neutral" }}
                    loading={isLoading}
                    className="border-l-4 border-l-yellow-500"
                />
            </div>

            {/* Content */}
            <Card className="flex-1 overflow-hidden border-0 shadow-sm bg-transparent">
                <div className="h-full overflow-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <QuoteDataTable
                        data={quotes}
                        isLoading={isLoading}
                        onRowClick={setSelectedId}
                    />
                </div>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>New Quote</DialogTitle>
                    </DialogHeader>
                    <QuoteForm
                        onSuccess={() => setIsCreateOpen(false)}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Details Sheet */}
            <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
                <SheetContent
                    side="right"
                    className="w-[400px] sm:w-[540px] md:w-[600px] p-0 border-l border-gray-200 dark:border-gray-800"
                >
                    <SheetTitle className="sr-only">Details</SheetTitle>
                    {selectedId && (
                        <QuoteDetailsPanel
                            quoteId={selectedId}
                            onClose={() => setSelectedId(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
