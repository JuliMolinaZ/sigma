"use client";

import { useAccountReceivable, useUpdateAccountReceivable, useDeleteAccountReceivable, usePaymentComplementsByAR, useCreatePaymentComplement } from "@/hooks/useFinance";
import { useAuthStore } from '@/store/auth.store';
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
    Briefcase,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle
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
import { ARForm } from "./ARForm";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ARDetailsPanelProps {
    arId: string;
    onClose: () => void;
}

export function ARDetailsPanel({ arId, onClose }: ARDetailsPanelProps) {
    const { data: ar, isLoading } = useAccountReceivable(arId);
    const updateAR = useUpdateAccountReceivable();
    const deleteAR = useDeleteAccountReceivable();
    const { user } = useAuthStore();

    const { data: payments, isLoading: isLoadingPayments } = usePaymentComplementsByAR(arId);
    const createPayment = useCreatePaymentComplement();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader size="lg" text="Loading details..." />
            </div>
        );
    }

    if (!ar) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Record not found</h2>
                <Button variant="outline" onClick={onClose}>
                    Close Panel
                </Button>
            </div>
        );
    }

    const handleUpdate = async (data: any) => {
        try {
            await updateAR.mutateAsync({ id: arId, data });
            toast.success("Record updated successfully");
            setIsEditOpen(false);
        } catch (error) {
            toast.error("Failed to update record");
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteAR.mutateAsync(arId);
            toast.success("Record deleted successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to delete record");
            console.error(error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'PARTIAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'OVERDUE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID': return <CheckCircle2 className="w-3 h-3 mr-1" />;
            case 'PARTIAL': return <Clock className="w-3 h-3 mr-1" />;
            case 'OVERDUE': return <AlertCircle className="w-3 h-3 mr-1" />;
            case 'PENDING': return <Clock className="w-3 h-3 mr-1" />;
            default: return <XCircle className="w-3 h-3 mr-1" />;
        }
    };

    const progress = (ar.montoPagado / ar.monto) * 100;

    const handlePayment = async () => {
        if (!ar || !paymentAmount) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (amount > Number(ar.montoRestante || 0)) {
            toast.error('Amount cannot exceed remaining debt');
            return;
        }

        try {
            await createPayment.mutateAsync({
                accountReceivableId: ar.id,
                monto: amount,
                fechaPago: new Date().toISOString(),
                formaPago: 'TRANSFER', // Default for now, can be added to UI later
                notas: 'Payment registered via AR Panel'
            });

            toast.success('Payment registered successfully');
            setIsPaymentDialogOpen(false);
            setPaymentAmount('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to register payment');
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-none p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 pr-8">
                            {ar.concepto}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={getStatusColor(ar.status)}>
                                {getStatusIcon(ar.status)}
                                {ar.status}
                            </Badge>
                        </div>
                    </div>
                    {/* Close button handled by Sheet */}
                </div>

                {/* Client Info */}
                {ar.client && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {ar.client.nombre}
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
                            Financials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Payment Progress</span>
                                <span className="font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Amount</span>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                                    {formatCurrency(ar.monto)}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Paid</span>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                                    {formatCurrency(ar.montoPagado)}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg col-span-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Remaining</span>
                                <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                                    {formatCurrency(ar.montoRestante)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment History Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Payment History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPayments ? (
                            <div className="flex justify-center py-6">
                                <Loader size="sm" text="Loading history..." />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Registered Payments */}
                                {payments && payments.map((payment: any) => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                                                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(payment.monto)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(payment.fechaPago)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {payment.formaPago || 'Transfer'}
                                        </Badge>
                                    </div>
                                ))}

                                {/* Legacy/Manual Payments Calculation */}
                                {(() => {
                                    const totalRegistered = payments?.reduce((sum: number, p: any) => sum + Number(p.monto), 0) || 0;
                                    const unregisteredAmount = Number(ar.montoPagado || 0) - totalRegistered;

                                    if (unregisteredAmount > 0.01) { // Epsilon for float precision
                                        return (
                                            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                                                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {formatCurrency(unregisteredAmount)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Previous / Manual Records
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                    Legacy
                                                </Badge>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {(!payments || payments.length === 0) && (Number(ar.montoPagado || 0) <= 0) && (
                                    <div className="text-center py-6 text-muted-foreground text-sm">
                                        No payments recorded yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Details Card */}
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
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Date</span>
                            </div>
                            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {formatDate(ar.fechaVencimiento)}
                            </span>
                        </div>

                        {ar.project && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                        <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Project</span>
                                </div>
                                <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    {ar.project.name}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Footer Actions */}
            <div className="flex-none p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                {/* Payment Button */}
                {ar.status !== 'PAID' && ar.status !== 'CANCELLED' && (
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                            setPaymentAmount('');
                            setIsPaymentDialogOpen(true);
                        }}
                    >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Register Payment
                    </Button>
                )}

                {['SUPERADMIN', 'CEO', 'CFO'].includes((user?.role || '').toUpperCase()) && (
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
                )}
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Register Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Remaining Debt:</span>
                                <span className="font-bold">{formatCurrency(ar.montoRestante)}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setPaymentAmount(ar.montoRestante.toString())}
                                >
                                    Pay Full Amount
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setPaymentAmount((ar.montoRestante / 2).toString())}
                                >
                                    Pay 50%
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="amount" className="text-sm font-medium">
                                Payment Amount
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button
                            className="w-full"
                            onClick={handlePayment}
                            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                        >
                            Confirm Payment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Account Receivable</DialogTitle>
                    </DialogHeader>
                    <ARForm
                        accountReceivable={ar}
                        onSuccess={() => setIsEditOpen(false)}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Record</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this record? This action cannot be undone.
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
