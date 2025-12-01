'use client'

import { FileText, Download, Send, Check, X, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PurchaseOrder } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { generatePurchaseOrderPDF } from '@/lib/generatePurchaseOrderPDF'
import { toast } from 'sonner'

const STATUS_COLORS = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAID: 'bg-blue-100 text-blue-800',
}

const STATUS_LABELS = {
    DRAFT: 'Borrador',
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    PAID: 'Pagada',
}

interface PODetailsPanelProps {
    purchaseOrder: PurchaseOrder
    onSubmit?: (id: string) => void
    onApprove?: (id: string) => void
    onReject?: (id: string) => void
    onMarkPaid?: (id: string) => void
}

export function PODetailsPanel({
    purchaseOrder,
    onSubmit,
    onApprove,
    onReject,
    onMarkPaid,
}: PODetailsPanelProps) {
    const handleGeneratePDF = () => {
        try {
            generatePurchaseOrderPDF({
                folio: purchaseOrder.folio || purchaseOrder.id,
                descripcion: purchaseOrder.description || 'Sin descripción',
                monto: purchaseOrder.amount || 0,
                fecha: purchaseOrder.createdAt ? new Date(purchaseOrder.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                fechaMinPago: purchaseOrder.minPaymentDate,
                fechaMaxPago: purchaseOrder.maxPaymentDate,
                autoriza: 'Dirección General',
                comentarios: purchaseOrder.comments,
                supplier: purchaseOrder.supplier,
                project: purchaseOrder.project,
                createdBy: purchaseOrder.createdBy,
                approvedBy: purchaseOrder.authorizedBy,
                approvedAt: purchaseOrder.authorizedAt,
            })
            toast.success('PDF generado correctamente')
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.error('Error al generar el PDF')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
        } catch {
            return 'N/A'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header with Status and Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Orden de Compra #{purchaseOrder.folio}</h2>
                    <p className="text-sm text-muted-foreground">
                        Creada el {formatDate(purchaseOrder.createdAt)}
                    </p>
                </div>
                <Badge className={STATUS_COLORS[purchaseOrder.status as keyof typeof STATUS_COLORS]}>
                    {STATUS_LABELS[purchaseOrder.status as keyof typeof STATUS_LABELS]}
                </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleGeneratePDF} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Generar PDF
                </Button>

                {purchaseOrder.status === 'DRAFT' && onSubmit && (
                    <Button onClick={() => onSubmit(purchaseOrder.id)} variant="default" size="sm">
                        <Send className="mr-2 h-4 w-4" />
                        Enviar para Aprobación
                    </Button>
                )}

                {purchaseOrder.status === 'PENDING' && onApprove && (
                    <>
                        <Button onClick={() => onApprove(purchaseOrder.id)} variant="default" size="sm">
                            <Check className="mr-2 h-4 w-4" />
                            Aprobar
                        </Button>
                        {onReject && (
                            <Button onClick={() => onReject(purchaseOrder.id)} variant="destructive" size="sm">
                                <X className="mr-2 h-4 w-4" />
                                Rechazar
                            </Button>
                        )}
                    </>
                )}

                {purchaseOrder.status === 'APPROVED' && onMarkPaid && (
                    <Button onClick={() => onMarkPaid(purchaseOrder.id)} variant="default" size="sm">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Marcar como Pagada
                    </Button>
                )}
            </div>

            <Separator />

            {/* Main Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Proveedor</p>
                            <p className="text-base">{purchaseOrder.supplier?.nombre || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Proyecto</p>
                            <p className="text-base">{purchaseOrder.project?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Fecha Mínima de Pago</p>
                            <p className="text-base">{formatDate(purchaseOrder.minPaymentDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Fecha Máxima de Pago</p>
                            <p className="text-base">{formatDate(purchaseOrder.maxPaymentDate)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Description */}
            <Card>
                <CardHeader>
                    <CardTitle>Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{purchaseOrder.description || 'Sin descripción'}</p>
                </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card>
                <CardHeader>
                    <CardTitle>Trazabilidad</CardTitle>
                    <CardDescription>Historial de creación y aprobación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                            <p className="text-sm font-medium">Creado por</p>
                            <p className="text-base">
                                {purchaseOrder.createdBy
                                    ? `${purchaseOrder.createdBy.firstName} ${purchaseOrder.createdBy.lastName}`
                                    : 'N/A'}
                            </p>
                            {purchaseOrder.createdAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(purchaseOrder.createdAt)}
                                </p>
                            )}
                        </div>
                    </div>
                    {purchaseOrder.authorizedBy && (
                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">Aprobado por</p>
                                <p className="text-base text-green-900 dark:text-green-100">
                                    {`${purchaseOrder.authorizedBy.firstName} ${purchaseOrder.authorizedBy.lastName}`}
                                </p>
                                {purchaseOrder.authorizedAt && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                        {formatDate(purchaseOrder.authorizedAt)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {!purchaseOrder.authorizedBy && purchaseOrder.status !== 'DRAFT' && (
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Pendiente de aprobación
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen Financiero</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>{formatCurrency(purchaseOrder.amount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">IVA (16%):</span>
                        <span>{formatCurrency((purchaseOrder.amount || 0) * 0.16)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency((purchaseOrder.amount || 0) * 1.16)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            {purchaseOrder.comments && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notas Adicionales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{purchaseOrder.comments}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
