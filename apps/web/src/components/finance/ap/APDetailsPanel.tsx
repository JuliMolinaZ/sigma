"use client";

import { useAccountPayable, useUpdateAccountPayable, useDeleteAccountPayable, usePaymentComplementsByAP, useCreatePaymentComplement } from "@/hooks/useFinance";
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
    XCircle,
    Building2,
    Tag,
    PenTool
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
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
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface APDetailsPanelProps {
    apId: string;
    onClose: () => void;
    onEdit: (ap: any) => void;
}

export function APDetailsPanel({ apId, onClose, onEdit }: APDetailsPanelProps) {
    const { data: ap, isLoading } = useAccountPayable(apId);
    const updateAP = useUpdateAccountPayable();
    const deleteAP = useDeleteAccountPayable();
    const { user } = useAuthStore();

    const { data: payments, isLoading: isLoadingPayments } = usePaymentComplementsByAP(apId);
    const createPayment = useCreatePaymentComplement();

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isAuthorizeOpen, setIsAuthorizeOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [signature, setSignature] = useState("");

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader size="lg" text="Cargando detalles..." />
            </div>
        );
    }

    if (!ap) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Registro no encontrado</h2>
                <Button variant="outline" onClick={onClose}>
                    Cerrar Panel
                </Button>
            </div>
        );
    }

    const handleDelete = async () => {
        try {
            await deleteAP.mutateAsync(apId);
            toast.success("Registro eliminado correctamente");
            onClose();
        } catch (error) {
            toast.error("Error al eliminar el registro");
            console.error(error);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Por favor ingrese un monto válido");
            return;
        }

        const safeRemaining = Number(ap.montoRestante ?? ap.monto);

        if (amount > safeRemaining) {
            toast.error("El monto no puede ser mayor a la deuda restante");
            return;
        }

        try {
            await createPayment.mutateAsync({
                accountPayableId: apId,
                monto: amount,
                fechaPago: new Date().toISOString(),
                formaPago: 'TRANSFER', // Default
                notas: 'Payment registered via AP Panel'
            });

            toast.success("Pago registrado correctamente");
            setIsPaymentOpen(false);
            setPaymentAmount("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al registrar el pago");
            console.error(error);
        }
    };

    const handleAuthorize = async () => {
        if (!signature.trim()) {
            toast.error("Por favor firme para autorizar");
            return;
        }

        const signerName = `${user?.firstName} ${user?.lastName}`;

        try {
            await updateAP.mutateAsync({
                id: apId,
                data: {
                    autorizado: true,
                    notas: ap.notas ? `${ap.notas}\n[Autorizado por: ${signerName} - ${new Date().toLocaleDateString()}]` : `[Autorizado por: ${signerName} - ${new Date().toLocaleDateString()}]`
                }
            });
            toast.success("Cuenta autorizada correctamente");
            setIsAuthorizeOpen(false);
        } catch (error) {
            toast.error("Error al autorizar la cuenta");
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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PAID': return 'Pagada';
            case 'PARTIAL': return 'Pago Parcial';
            case 'OVERDUE': return 'Vencida';
            case 'PENDING': return 'Por Pagar';
            case 'CANCELLED': return 'Cancelada';
            default: return status;
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

    const safeMonto = Number(ap.monto || 0);
    const safePaid = Number(ap.montoPagado || 0);
    const safeRemaining = Number(ap.montoRestante ?? safeMonto);

    const progress = safeMonto > 0 ? (safePaid / safeMonto) * 100 : 0;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-none p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 pr-8">
                            {ap.concepto}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={getStatusColor(ap.status)}>
                                {getStatusIcon(ap.status)}
                                {getStatusLabel(ap.status)}
                            </Badge>
                            {ap.autorizado ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Autorizado
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pendiente Autorización
                                </Badge>
                            )}
                        </div>
                    </div>
                    {/* Close button handled by Sheet */}
                </div>

                {/* Supplier Info */}
                {ap.supplier && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                            <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {ap.supplier.nombre}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Proveedor
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
                            Finanzas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progreso de Pago</span>
                                <span className="font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Monto Total</span>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                                    {formatCurrency(safeMonto)}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Pagado</span>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                                    {formatCurrency(safePaid)}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg col-span-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Restante</span>
                                <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                                    {formatCurrency(safeRemaining)}
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
                            Historial de Pagos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPayments ? (
                            <div className="flex justify-center py-6">
                                <Loader size="sm" text="Cargando historial..." />
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
                                            {payment.formaPago || 'Transferencia'}
                                        </Badge>
                                    </div>
                                ))}

                                {/* Legacy/Manual Payments Calculation */}
                                {(() => {
                                    const totalRegistered = payments?.reduce((sum: number, p: any) => sum + Number(p.monto), 0) || 0;
                                    const unregisteredAmount = Number(ap.montoPagado || 0) - totalRegistered;

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
                                                            Registros Anteriores / Manuales
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

                                {(!payments || payments.length === 0) && (Number(ap.montoPagado || 0) <= 0) && (
                                    <div className="text-center py-6 text-muted-foreground text-sm">
                                        No hay pagos registrados.
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
                            Detalles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha Vencimiento</span>
                            </div>
                            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {formatDate(ap.fechaVencimiento)}
                            </span>
                        </div>

                        {ap.category && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                                        <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Categoría</span>
                                </div>
                                <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    {ap.category.nombre}
                                </span>
                            </div>
                        )}

                        {ap.notas && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Notas</span>
                                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                    {ap.notas}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Footer Actions */}
            <div className="flex-none p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                {!ap.autorizado && ['SUPERADMIN', 'CEO'].includes((user?.role || '').toUpperCase()) && (
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
                        onClick={() => setIsAuthorizeOpen(true)}
                    >
                        <PenTool className="w-4 h-4 mr-2" />
                        Autorizar Pago
                    </Button>
                )}

                <div className="flex gap-2">
                    {ap.autorizado && (ap.status === 'PENDING' || ap.status === 'PARTIAL' || ap.status === 'OVERDUE') &&
                        ['SUPERADMIN', 'CEO', 'CFO', 'GERENTE_ADMINISTRATIVO'].includes((user?.role || '').toUpperCase()) && (
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setIsPaymentOpen(true)}
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Registrar Pago
                            </Button>
                        )}

                    {['SUPERADMIN', 'CEO', 'CFO'].includes((user?.role || '').toUpperCase()) && (
                        <>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => onEdit(ap)}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                                onClick={() => setIsDeleteOpen(true)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Pago</DialogTitle>
                        <DialogDescription>
                            Ingrese el monto del pago a registrar.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayment}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Monto</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Restante: {formatCurrency(safeRemaining)}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                Confirmar Pago
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Authorize Dialog */}
            <Dialog open={isAuthorizeOpen} onOpenChange={setIsAuthorizeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Autorizar Cuenta por Pagar</DialogTitle>
                        <DialogDescription>
                            Como {user?.role}, su firma es requerida para autorizar este pago.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-gray-300">
                            <p className="text-sm text-muted-foreground mb-2">Firma Digital (Escriba su nombre completo)</p>
                            <Input
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder={`${user?.firstName} ${user?.lastName}` || "Nombre completo"}
                                className="font-serif italic text-lg"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Al firmar, usted autoriza la salida de efectivo para esta obligación financiera. Esta acción quedará registrada.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAuthorizeOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAuthorize}>Firmar y Autorizar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Registro</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
