"use client";

import { useAccountPayable, useUpdateAccountPayable, useDeleteAccountPayable, usePaymentComplementsByAP, usePaymentComplementsBySupplier, useCreatePaymentComplement, AccountPayable } from "@/hooks/useFinance";
import { useAuthStore } from '@/store/auth.store';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/loader";
import {
    Edit,
    Trash2,
    Calendar,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Building2,
    Tag,
    PenTool
} from "lucide-react";
import { formatDate } from "@/lib/utils";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialMetrics } from "../shared/FinancialMetrics";
import { PaymentHistoryTable } from "../shared/PaymentHistoryTable";

interface APDetailsPanelProps {
    apId: string;
    onClose: () => void;
    onEdit: (ap: AccountPayable) => void;
}

export function APDetailsPanel({ apId, onClose, onEdit }: APDetailsPanelProps) {
    const { data: ap, isLoading } = useAccountPayable(apId);
    const updateAP = useUpdateAccountPayable();
    const deleteAP = useDeleteAccountPayable();
    const { user } = useAuthStore();

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isAuthorizeOpen, setIsAuthorizeOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
    const [paymentReference, setPaymentReference] = useState('');
    const [signature, setSignature] = useState("");
    const [viewMode, setViewMode] = useState<'date' | 'supplier'>('date');

    // Fetch payments based on view mode
    const { data: paymentsByAP, isLoading: isLoadingPaymentsByAP } = usePaymentComplementsByAP(apId);
    const { data: paymentsBySupplier, isLoading: isLoadingPaymentsBySupplier } = usePaymentComplementsBySupplier(
        ap?.supplier?.id || '',
        { enabled: viewMode === 'supplier' && !!ap?.supplier?.id }
    );

    // Determine which payments to use based on view mode
    const payments = viewMode === 'supplier' ? (paymentsBySupplier || []) : (paymentsByAP || []);
    const isLoadingPayments = viewMode === 'supplier' ? isLoadingPaymentsBySupplier : isLoadingPaymentsByAP;

    const createPayment = useCreatePaymentComplement();

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
                <h2 className="text-lg font-semibold text-foreground">Registro no encontrado</h2>
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
        } catch {
            toast.error("Error al eliminar el registro");
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
                fechaPago: new Date(paymentDate).toISOString(),
                formaPago: paymentMethod,
                referencia: paymentReference || undefined,
                notas: 'Payment registered via AP Panel'
            });

            toast.success("Pago registrado correctamente");
            setIsPaymentOpen(false);
            setPaymentAmount("");
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setPaymentMethod('TRANSFER');
            setPaymentReference('');
        } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(errorMessage || "Error al registrar el pago");
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
        } catch {
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

    // Calculate legacy payments (only for date view, not supplier view)
    const paymentsForLegacy = viewMode === 'date' ? paymentsByAP : [];
    const totalRegistered = paymentsForLegacy?.reduce((sum: number, p: typeof paymentsForLegacy[0]) => sum + Number(p.monto || p.amount || 0), 0) || 0;
    const unregisteredAmount = Number(ap.montoPagado || 0) - totalRegistered;
    const hasLegacyPayments = viewMode === 'date' && unregisteredAmount > 0.01;

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="flex-none px-6 py-5 border-b bg-muted/30">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold text-foreground leading-snug">
                                {ap.concepto}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`${getStatusColor(ap.status)} text-xs px-2 py-0.5`}>
                            {getStatusIcon(ap.status)}
                            {getStatusLabel(ap.status)}
                        </Badge>
                        {ap.autorizado ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-0.5">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Autorizado
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 text-xs px-2 py-0.5">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendiente Autorización
                            </Badge>
                        )}
                    </div>

                    {/* Supplier Info */}
                    {ap.supplier && (
                        <div className="flex items-center gap-3 pt-2">
                            <div className="p-1.5 bg-muted rounded-md">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {ap.supplier.nombre}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Proveedor
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Financial Metrics */}
                <FinancialMetrics
                    total={safeMonto}
                    paid={safePaid}
                    remaining={safeRemaining}
                    progress={progress}
                    title="Finanzas"
                />

                {/* Payment History */}
                <Card className="border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                Historial de Pagos
                            </CardTitle>
                            <div className="flex gap-1.5">
                                <Button
                                    variant={viewMode === 'date' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('date')}
                                    className="h-7 px-3 text-xs"
                                >
                                    <Calendar className="w-3 h-3 mr-1.5" />
                                    Por Fecha
                                </Button>
                                <Button
                                    variant={viewMode === 'supplier' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('supplier')}
                                    className="h-7 px-3 text-xs"
                                >
                                    <Building2 className="w-3 h-3 mr-1.5" />
                                    Por Proveedor
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {isLoadingPayments ? (
                            <div className="flex justify-center py-8">
                                <Loader size="sm" text="Cargando historial..." />
                            </div>
                        ) : (
                            <PaymentHistoryTable
                                payments={payments || []}
                                groupBy={viewMode === 'supplier' ? 'entity' : viewMode}
                                entityName={ap.supplier?.nombre}
                            />
                        )}

                        {/* Legacy Payments */}
                        {hasLegacyPayments && (
                            <div className="mt-3 pt-3 border-t">
                                <div className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/30">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                        <div>
                                            <p className="text-xs font-medium text-foreground">
                                                {unregisteredAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Registros Anteriores / Manuales
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                        Legacy
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Details */}
                <Card className="border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            Detalles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2.5">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Fecha Vencimiento</span>
                            </div>
                            <span className="text-sm font-medium text-foreground">
                                {formatDate(ap.fechaVencimiento)}
                            </span>
                        </div>

                        {ap.category && (
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2.5">
                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Categoría</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                    {ap.category.nombre}
                                </span>
                            </div>
                        )}

                        {ap.notas && (
                            <div className="pt-2 border-t">
                                <div className="text-xs text-muted-foreground mb-1.5">Notas</div>
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                    {ap.notas}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Footer Actions */}
            <div className="flex-none px-6 py-4 border-t bg-muted/30 space-y-2.5">
                {!ap.autorizado && ['SUPERADMIN', 'CEO'].includes((user?.role || '').toUpperCase()) && (
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm font-medium"
                        onClick={() => setIsAuthorizeOpen(true)}
                    >
                        <PenTool className="w-3.5 h-3.5 mr-1.5" />
                        Autorizar Pago
                    </Button>
                )}

                <div className="flex gap-2">
                    {ap.autorizado && (ap.status === 'PENDING' || ap.status === 'PARTIAL' || ap.status === 'OVERDUE') &&
                        ['SUPERADMIN', 'CEO', 'CFO', 'GERENTE_ADMINISTRATIVO'].includes((user?.role || '').toUpperCase()) && (
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-sm font-medium"
                                onClick={() => {
                                    setPaymentAmount("");
                                    setPaymentDate(new Date().toISOString().split('T')[0]);
                                    setPaymentMethod('TRANSFER');
                                    setPaymentReference('');
                                    setIsPaymentOpen(true);
                                }}
                            >
                                Registrar Pago
                            </Button>
                        )}

                    {['SUPERADMIN', 'CEO', 'CFO'].includes((user?.role || '').toUpperCase()) && (
                        <>
                            <Button
                                variant="outline"
                                className="flex-1 h-9 text-sm"
                                onClick={() => onEdit(ap)}
                            >
                                <Edit className="w-3.5 h-3.5 mr-1.5" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-9 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                                onClick={() => setIsDeleteOpen(true)}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Eliminar
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-base">Registrar Pago</DialogTitle>
                        <DialogDescription className="text-sm">
                            Ingrese el monto del pago a registrar.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayment}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-sm">Monto</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="h-9"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Restante: {safeRemaining.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentDate" className="text-sm">Fecha de Pago *</Label>
                                <DatePicker
                                    date={paymentDate ? new Date(paymentDate) : undefined}
                                    onDateChange={(date) => {
                                        setPaymentDate(date ? date.toISOString().split('T')[0] : '');
                                    }}
                                    placeholder="Seleccionar fecha de pago"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod" className="text-sm">Forma de Pago *</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger id="paymentMethod" className="h-9">
                                        <SelectValue placeholder="Seleccionar forma de pago" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TRANSFER">Transferencia (SPEI)</SelectItem>
                                        <SelectItem value="CASH">Efectivo</SelectItem>
                                        <SelectItem value="CHECK">Cheque</SelectItem>
                                        <SelectItem value="CARD">Tarjeta de Crédito/Débito</SelectItem>
                                        <SelectItem value="WIRE">Transferencia Bancaria</SelectItem>
                                        <SelectItem value="OTHER">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentReference" className="text-sm">Referencia (Opcional)</Label>
                                <Input
                                    id="paymentReference"
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="e.g. Clave de rastreo SPEI, número de cheque, etc."
                                    className="h-9"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)} className="h-9 text-sm">
                                Cancelar
                            </Button>
                            <Button type="submit" className="h-9 text-sm">
                                Confirmar Pago
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Authorize Dialog */}
            <Dialog open={isAuthorizeOpen} onOpenChange={setIsAuthorizeOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-base">Autorizar Cuenta por Pagar</DialogTitle>
                        <DialogDescription className="text-sm">
                            Como {user?.role}, su firma es requerida para autorizar este pago.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                            <p className="text-xs text-muted-foreground mb-2">Firma Digital (Escriba su nombre completo)</p>
                            <Input
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder={`${user?.firstName} ${user?.lastName}` || "Nombre completo"}
                                className="font-serif italic h-9"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Al firmar, usted autoriza la salida de efectivo para esta obligación financiera. Esta acción quedará registrada.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAuthorizeOpen(false)} className="h-9 text-sm">Cancelar</Button>
                        <Button onClick={handleAuthorize} className="h-9 text-sm">Firmar y Autorizar</Button>
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
