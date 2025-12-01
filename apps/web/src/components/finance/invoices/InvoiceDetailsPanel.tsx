"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Edit,
    Trash2,
    Calendar,
    User,
    FileText,
    CheckCircle,
    Download
} from "lucide-react";
import { Invoice } from "@/hooks/useFinance";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from 'sonner';
import { useRouter } from "next/navigation";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface InvoiceDetailsPanelProps {
    invoice: Invoice;
    onEdit?: () => void;
}

export function InvoiceDetailsPanel({ invoice, onEdit }: InvoiceDetailsPanelProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/finance/invoices/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.put(`/finance/invoices/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
    });

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(invoice.id);
            toast.success("Invoice deleted successfully");
            router.push("/finance/invoices");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete invoice");
        }
    };

    const handleMarkAsPaid = async () => {
        try {
            await updateMutation.mutateAsync({
                id: invoice.id,
                data: { status: "PAID" }
            });
            toast.success("Invoice marked as paid");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update invoice");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'SENT':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'DRAFT':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
            case 'OVERDUE':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'CANCELLED':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    return (
        <>
            <Card className="p-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Invoice {invoice.number}
                            </h2>
                            <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status}
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                            </Button>
                            {onEdit && (
                                <Button variant="outline" size="sm" onClick={onEdit}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem
                            icon={User}
                            label="Client"
                            value={invoice.client?.nombre || "-"}
                        />
                        <DetailItem
                            icon={Calendar}
                            label="Issue Date"
                            value={formatDate(invoice.issueDate)}
                        />
                        <DetailItem
                            icon={Calendar}
                            label="Due Date"
                            value={formatDate(invoice.dueDate)}
                        />
                        <DetailItem
                            icon={FileText}
                            label="Total Amount"
                            value={formatCurrency(Number(invoice.amount))}
                        />
                    </div>

                    {/* Items Table */}
                    {invoice.items && invoice.items.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">Items</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(item.unitPrice))}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(Number(item.total))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="p-4 border rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                            <p className="text-foreground">{invoice.notes}</p>
                        </div>
                    )}

                    {/* Actions */}
                    {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                variant="default"
                                className="flex-1"
                                onClick={handleMarkAsPaid}
                                disabled={updateMutation.isPending}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Paid
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this invoice? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

interface DetailItemProps {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

export function InvoiceDetailsSkeleton() {
    return (
        <Card className="p-6">
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                    ))}
                </div>
                <Skeleton className="h-48 w-full" />
            </div>
        </Card>
    );
}
