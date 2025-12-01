"use client";

import { useState, useMemo } from "react";
import { Plus, DollarSign, Activity, Calendar, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FixedCostDataTable } from "@/components/finance/fixed-costs/FixedCostDataTable";
import { FixedCostForm } from "@/components/finance/fixed-costs/FixedCostForm";
import { FixedCostDetailsPanel } from "@/components/finance/fixed-costs/FixedCostDetailsPanel";
import { useFixedCosts, useCreateFixedCost, FixedCost } from "@/hooks/useFinance";
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
import { checkModuleAccess } from "@/lib/constants";
import { useAuthStore } from "@/store/auth.store";
import AccessDenied from "@/components/ui/access-denied";
import { KPICard } from "@/components/ui/kpi-card";
import { formatCurrency } from "@/lib/utils";

export default function FixedCostsPage() {
    const { user } = useAuthStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { data: fixedCosts = [], isLoading } = useFixedCosts();
    const createFixedCost = useCreateFixedCost();

    const kpis = useMemo(() => {
        const activeCosts = fixedCosts.filter((fc: FixedCost) => fc.isActive);

        const totalMonthly = activeCosts
            .reduce((sum: number, fc: FixedCost) => sum + (fc.amount || 0), 0);

        const activeCount = activeCosts.length;
        const projectedAnnual = totalMonthly * 12;
        const averageCost = activeCount > 0 ? totalMonthly / activeCount : 0;

        return {
            totalMonthly,
            activeCount,
            projectedAnnual,
            averageCost
        };
    }, [fixedCosts]);

    if (!checkModuleAccess("finance", user)) {
        return <AccessDenied />;
    }

    const handleCreate = async (data: any) => {
        try {
            await createFixedCost.mutateAsync(data);
            toast.success("Fixed cost created successfully");
            setIsCreateOpen(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create fixed cost");
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-none">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Fixed Costs</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your recurring expenses and overheads
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Fixed Cost
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-none">
                <KPICard
                    title="Total Monthly"
                    value={formatCurrency(kpis.totalMonthly)}
                    icon={DollarSign}
                    trend={{ value: 0, label: "recurring monthly", direction: "neutral" }}
                    loading={isLoading}
                />
                <KPICard
                    title="Active Costs"
                    value={kpis.activeCount.toString()}
                    icon={Activity}
                    trend={{ value: 0, label: "active items", direction: "neutral" }}
                    loading={isLoading}
                />
                <KPICard
                    title="Projected Annual"
                    value={formatCurrency(kpis.projectedAnnual)}
                    icon={Calendar}
                    trend={{ value: 0, label: "estimated yearly", direction: "neutral" }}
                    loading={isLoading}
                />
                <KPICard
                    title="Average Cost"
                    value={formatCurrency(kpis.averageCost)}
                    icon={TrendingUp}
                    trend={{ value: 0, label: "per item", direction: "neutral" }}
                    loading={isLoading}
                />
            </div>

            {/* Content */}
            <Card className="flex-1 overflow-hidden border-0 shadow-sm bg-transparent">
                <div className="h-full overflow-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <FixedCostDataTable
                        data={fixedCosts}
                        isLoading={isLoading}
                        onRowClick={setSelectedId}
                    />
                </div>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Fixed Cost</DialogTitle>
                    </DialogHeader>
                    <FixedCostForm
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
                    <SheetTitle className="sr-only">Fixed Cost Details</SheetTitle>
                    {selectedId && (
                        <FixedCostDetailsPanel
                            fixedCostId={selectedId}
                            onClose={() => setSelectedId(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
