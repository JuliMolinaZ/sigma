"use client";

import { useState, useMemo } from "react";
import { Plus, DollarSign, AlertCircle, TrendingUp, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ARDataTable } from "@/components/finance/ar/ARDataTable";
import { ARForm } from "@/components/finance/ar/ARForm";
import { ARDetailsPanel } from "@/components/finance/ar/ARDetailsPanel";
import { useAccountsReceivable, useCreateAccountReceivable, AccountReceivable } from "@/hooks/useFinance";
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
import { useTranslations } from "next-intl";

export default function ARPage() {
    const { user } = useAuthStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { data: accounts = [], isLoading } = useAccountsReceivable({});
    const createAR = useCreateAccountReceivable();
    const t = useTranslations('financeAR');

    const kpis = useMemo(() => {
        const totalOutstanding = accounts
            .filter((a: AccountReceivable) => a.status !== 'CANCELLED' && a.status !== 'PAID')
            .reduce((sum: number, a: AccountReceivable) => sum + Number(a.montoRestante || 0), 0);

        const overdueAmount = accounts
            .filter((a: AccountReceivable) => a.status === 'OVERDUE')
            .reduce((sum: number, a: AccountReceivable) => sum + Number(a.montoRestante || 0), 0);

        const totalAmount = accounts
            .filter((a: AccountReceivable) => a.status !== 'CANCELLED')
            .reduce((sum: number, a: AccountReceivable) => sum + Number(a.monto || 0), 0);

        const totalPaid = accounts
            .filter((a: AccountReceivable) => a.status !== 'CANCELLED')
            .reduce((sum: number, a: AccountReceivable) => sum + Number(a.montoPagado || 0), 0);

        const collectionRate = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

        const activeCount = accounts.filter((a: AccountReceivable) =>
            ['PENDING', 'PARTIAL', 'OVERDUE'].includes(a.status)
        ).length;

        return {
            totalOutstanding,
            overdueAmount,
            collectionRate,
            activeCount
        };
    }, [accounts]);

    if (!checkModuleAccess("finance", user)) {
        return <AccessDenied />;
    }

    const handleCreate = async (data: any) => {
        try {
            await createAR.mutateAsync(data);
            toast.success(t('createSuccess', { defaultValue: 'Record created successfully' }));
            setIsCreateOpen(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('createError', { defaultValue: 'Failed to create record' }));
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-none">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('create')}
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-none">
                <KPICard
                    title="Total Outstanding"
                    value={formatCurrency(kpis.totalOutstanding)}
                    icon={DollarSign}
                    trend={{ value: 12, label: "vs last month", direction: "neutral" }}
                    loading={isLoading}
                />
                <KPICard
                    title="Overdue Amount"
                    value={formatCurrency(kpis.overdueAmount)}
                    icon={AlertCircle}
                    trend={{ value: 8, label: "vs last month", direction: "down" }}
                    loading={isLoading}
                    className="border-l-4 border-l-red-500"
                />
                <KPICard
                    title="Collection Rate"
                    value={`${kpis.collectionRate.toFixed(1)}%`}
                    icon={TrendingUp}
                    trend={{ value: 2.5, label: "vs last month", direction: "up" }}
                    loading={isLoading}
                />
                <KPICard
                    title="Active Invoices"
                    value={kpis.activeCount.toString()}
                    icon={Activity}
                    trend={{ value: 0, label: "active records", direction: "neutral" }}
                    loading={isLoading}
                />
            </div>

            {/* Content */}
            <Card className="flex-1 overflow-hidden border-0 shadow-sm bg-transparent">
                <div className="h-full overflow-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <ARDataTable
                        data={accounts}
                        isLoading={isLoading}
                        onRowClick={setSelectedId}
                    />
                </div>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>New Account Receivable</DialogTitle>
                    </DialogHeader>
                    <ARForm
                        onSuccess={() => setIsCreateOpen(false)}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Details Sheet */}
            <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
                <SheetContent
                    side="right"
                    className="p-0 border-l border-gray-200 dark:border-gray-800 overflow-y-auto"
                    style={{ 
                        width: 'min(95vw, 800px)',
                        maxWidth: '800px'
                    }}
                >
                    <SheetTitle className="sr-only">Details</SheetTitle>
                    {selectedId && (
                        <ARDetailsPanel
                            arId={selectedId}
                            onClose={() => setSelectedId(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
