"use client";

import { useFixedCost, useUpdateFixedCost, useDeleteFixedCost } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/loader";
import {
    X,
    Edit,
    Trash2,
    DollarSign,
    Calendar,
    Tag,
    FileText,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
import { FixedCostForm } from "./FixedCostForm";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FixedCostDetailsPanelProps {
    fixedCostId: string;
    onClose: () => void;
}

export function FixedCostDetailsPanel({ fixedCostId, onClose }: FixedCostDetailsPanelProps) {
    const { data: fixedCost, isLoading } = useFixedCost(fixedCostId);
    const updateFixedCost = useUpdateFixedCost();
    const deleteFixedCost = useDeleteFixedCost();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader size="lg" text="Loading details..." />
            </div>
        );
    }

    if (!fixedCost) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Fixed Cost not found</h2>
                <Button variant="outline" onClick={onClose}>
                    Close Panel
                </Button>
            </div>
        );
    }

    const handleUpdate = async (data: any) => {
        try {
            await updateFixedCost.mutateAsync({ id: fixedCostId, data });
            toast.success("Fixed cost updated successfully");
            setIsEditOpen(false);
        } catch (error) {
            toast.error("Failed to update fixed cost");
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteFixedCost.mutateAsync(fixedCostId);
            toast.success("Fixed cost deleted successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to delete fixed cost");
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
                            {fixedCost.title}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Badge variant={fixedCost.isActive ? "default" : "secondary"} className={fixedCost.isActive ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300" : ""}>
                                {fixedCost.isActive ? (
                                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
                                ) : (
                                    <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                                )}
                            </Badge>
                            {fixedCost.category && (
                                <Badge variant="outline" style={{
                                    borderColor: fixedCost.category.color,
                                    color: fixedCost.category.color
                                }}>
                                    {fixedCost.category.nombre}
                                </Badge>
                            )}
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
                                {formatCurrency(fixedCost.amount)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Day of Month</span>
                            </div>
                            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {fixedCost.dayOfMonth}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</span>
                            </div>
                            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {fixedCost.category?.nombre || "Uncategorized"}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                {fixedCost.description && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {fixedCost.description}
                            </p>
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
                        <DialogTitle>Edit Fixed Cost</DialogTitle>
                    </DialogHeader>
                    <FixedCostForm
                        fixedCost={fixedCost}
                        onSuccess={() => setIsEditOpen(false)}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Fixed Cost</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this fixed cost? This action cannot be undone.
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
