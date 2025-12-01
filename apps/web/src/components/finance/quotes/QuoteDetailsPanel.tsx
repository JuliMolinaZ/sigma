"use client";

import { useQuote, useUpdateQuote, useDeleteQuote } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/loader";
import {
    X,
    Edit,
    Trash2,
    DollarSign,
    Calendar,
    FileText,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Send,
    Hash
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
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
import { QuoteForm } from "./QuoteForm";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface QuoteDetailsPanelProps {
    quoteId: string;
    onClose: () => void;
}

export function QuoteDetailsPanel({ quoteId, onClose }: QuoteDetailsPanelProps) {
    const { data: quote, isLoading } = useQuote(quoteId);
    const updateQuote = useUpdateQuote();
    const deleteQuote = useDeleteQuote();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader size="lg" text="Loading details..." />
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quote not found</h2>
                <Button variant="outline" onClick={onClose}>
                    Close Panel
                </Button>
            </div>
        );
    }

    const handleUpdate = async (data: any) => {
        try {
            await updateQuote.mutateAsync({ id: quoteId, data });
            toast.success("Quote updated successfully");
            setIsEditOpen(false);
        } catch (error) {
            toast.error("Failed to update quote");
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteQuote.mutateAsync(quoteId);
            toast.success("Quote deleted successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to delete quote");
            console.error(error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'SENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'EXPIRED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
            case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return <CheckCircle2 className="w-3 h-3 mr-1" />;
            case 'SENT': return <Send className="w-3 h-3 mr-1" />;
            case 'REJECTED': return <XCircle className="w-3 h-3 mr-1" />;
            case 'EXPIRED': return <Clock className="w-3 h-3 mr-1" />;
            case 'DRAFT': return <FileText className="w-3 h-3 mr-1" />;
            default: return <AlertCircle className="w-3 h-3 mr-1" />;
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-none p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Hash className="w-5 h-5 text-muted-foreground" />
                            {quote.number}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={getStatusColor(quote.status)}>
                                {getStatusIcon(quote.status)}
                                {quote.status}
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

                {/* Client Info */}
                {quote.client && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {quote.client.nombre}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Client
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Financials Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(quote.amount)}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Date</span>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                    {formatDate(quote.date)}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Valid Until</span>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                    {formatDate(quote.validUntil)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Card */}
                {quote.items && quote.items.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quote.items.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Notes */}
                {quote.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {quote.notes}
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
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Edit Quote</DialogTitle>
                    </DialogHeader>
                    <QuoteForm
                        quote={quote}
                        onSuccess={() => setIsEditOpen(false)}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this quote? This action cannot be undone.
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
