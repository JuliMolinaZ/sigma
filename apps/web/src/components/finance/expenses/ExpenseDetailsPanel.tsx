"use client";

import { useExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import {
    X,
    Edit,
    Trash2,
    DollarSign,
    Calendar,
    Tag,
    FileText,
    Briefcase,
    User,
    Receipt
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExpenseForm } from "./ExpenseForm";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusChip } from "@/components/shared/StatusChip";
import Image from "next/image";

interface ExpenseDetailsPanelProps {
    expenseId: string;
    onClose: () => void;
}

export function ExpenseDetailsPanel({ expenseId, onClose }: ExpenseDetailsPanelProps) {
    const { data: expense, isLoading } = useExpense(expenseId);
    const updateExpense = useUpdateExpense();
    const deleteExpense = useDeleteExpense();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader size="lg" text="Loading details..." />
            </div>
        );
    }

    if (!expense) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Expense not found</h2>
                <Button variant="outline" onClick={onClose}>
                    Close Panel
                </Button>
            </div>
        );
    }

    const handleUpdate = async (data: any) => {
        try {
            await updateExpense.mutateAsync({ id: expenseId, data });
            toast.success("Expense updated successfully");
            setIsEditOpen(false);
        } catch (error) {
            toast.error("Failed to update expense");
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteExpense.mutateAsync(expenseId);
            toast.success("Expense deleted successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to delete expense");
            console.error(error);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-none p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {expense.description}
                        </h2>
                        <div className="flex items-center gap-2">
                            <StatusChip status={expense.status} />
                            <Badge variant="outline">
                                {expense.category}
                            </Badge>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800">
                        <AvatarImage src={expense.user?.avatarUrl || `https://avatar.vercel.sh/${expense.user?.firstName}.png`} />
                        <AvatarFallback>{getInitials(expense.user?.firstName || "?", expense.user?.lastName || "")}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {expense.user ? `${expense.user.firstName} ${expense.user.lastName}` : "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Requested by
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Main Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(expense.amount, expense.currency)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</span>
                            </div>
                            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {formatDate(expense.date)}
                            </span>
                        </div>

                        {expense.project && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                        <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Project</span>
                                </div>
                                <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    {expense.project.name}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Receipt */}
                {expense.receiptUrl && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Receipt className="w-4 h-4" />
                                Receipt
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                                <Image
                                    src={expense.receiptUrl}
                                    alt="Receipt"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button variant="outline" size="sm" asChild>
                                    <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                                        View Full Size
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex-none p-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsEditOpen(true)}
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                        onClick={() => setIsDeleteOpen(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                    </DialogHeader>
                    <ExpenseForm
                        expense={expense}
                        onSuccess={() => setIsEditOpen(false)}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this expense? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
export function ExpenseDetailsSkeleton() {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            <div className="flex-none p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            </div>
            <div className="flex-1 p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-24" />
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
