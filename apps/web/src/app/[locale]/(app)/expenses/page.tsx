"use client";

import { useState, useMemo } from "react";
import { Plus, DollarSign, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpenseDataTable } from "@/components/finance/expenses/ExpenseDataTable";
import { ExpenseForm } from "@/components/finance/expenses/ExpenseForm";
import { ExpenseDetailsPanel } from "@/components/finance/expenses/ExpenseDetailsPanel";
import { useExpenses, useCreateExpense } from "@/hooks/useExpenses";
import { Expense } from "@/types";
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

export default function ExpensesPage() {
    const { user } = useAuthStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { data: expenses = [], isLoading } = useExpenses({});
    const createExpense = useCreateExpense();

    const kpis = useMemo(() => {
        const totalExpenses = expenses
            .filter((e: Expense) => e.status !== 'REJECTED')
            .reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0);

        const pendingCount = expenses
            .filter((e: Expense) => e.status === 'DRAFT' || e.status === 'SUBMITTED')
            .length;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const thisMonth = expenses
            .filter((e: Expense) => {
                const date = new Date(e.date);
                return e.status !== 'REJECTED' &&
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear;
            })
            .reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0);

        const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

        return {
            totalExpenses,
            pendingCount,
            thisMonth,
            averageExpense
        };
    }, [expenses]);

    if (!checkModuleAccess("finance", user)) {
        return <AccessDenied />;
    }

    const handleCreate = async (data: any) => {
        try {
            await createExpense.mutateAsync(data);
            toast.success("Expense created successfully");
            setIsCreateOpen(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create expense");
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-none">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track and manage company expenses
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-none">
                <KPICard
                    title="Total Expenses"
                    value={formatCurrency(kpis.totalExpenses)}
                    icon={DollarSign}
                    trend={{ value: 5, label: "vs last month", direction: "up" }}
                    loading={isLoading}
                />
                <KPICard
                    title="Pending Approval"
                    value={kpis.pendingCount.toString()}
                    icon={AlertCircle}
                    trend={{ value: 0, label: "pending requests", direction: "neutral" }}
                    loading={isLoading}
                    className="border-l-4 border-l-yellow-500"
                />
                <KPICard
                    title="This Month"
                    value={formatCurrency(kpis.thisMonth)}
                    icon={Calendar}
                    trend={{ value: 12, label: "vs last month", direction: "up" }}
                    loading={isLoading}
                />
                <KPICard
                    title="Average Expense"
                    value={formatCurrency(kpis.averageExpense)}
                    icon={TrendingUp}
                    trend={{ value: 0, label: "per transaction", direction: "neutral" }}
                    loading={isLoading}
                />
            </div>

            {/* Content */}
            <Card className="flex-1 overflow-hidden border-0 shadow-sm bg-transparent">
                <div className="h-full overflow-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <ExpenseDataTable
                        data={expenses}
                        isLoading={isLoading}
                        onRowClick={setSelectedId}
                    />
                </div>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Expense</DialogTitle>
                    </DialogHeader>
                    <ExpenseForm
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
                    <SheetTitle className="sr-only">Expense Details</SheetTitle>
                    {selectedId && (
                        <ExpenseDetailsPanel
                            expenseId={selectedId}
                            onClose={() => setSelectedId(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
