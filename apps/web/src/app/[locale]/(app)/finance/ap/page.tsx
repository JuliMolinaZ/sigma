'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
    Plus,
    TrendingDown,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAccountsPayable, useCreateAccountPayable, useUpdateAccountPayable, useDeleteAccountPayable, AccountPayable } from '@/hooks/useFinance'
import { useSuppliers } from '@/hooks/useSuppliers'
import { formatCurrency } from '@/lib/utils'
import { KPICard } from '@/components/ui/kpi-card'
import { APDataTable } from '@/components/finance/ap/APDataTable'
import { APDetailsPanel } from '@/components/finance/ap/APDetailsPanel'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/date-picker'

export default function AccountsPayablePage() {
    const t = useTranslations('financeAP')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedAP, setSelectedAP] = useState<AccountPayable | null>(null)
    const [selectedAPId, setSelectedAPId] = useState<string | null>(null)
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [formSupplierId, setFormSupplierId] = useState<string>('')
    const [fechaVencimiento, setFechaVencimiento] = useState<Date | undefined>(undefined)

    // Fetch all accounts without status filter to handle filtering client-side
    const { data: allAccountsPayable = [], isLoading, refetch } = useAccountsPayable({ status: undefined })
    const { data: suppliersData } = useSuppliers({ limit: 100 })

    const suppliers = useMemo(() => {
        if (!suppliersData) return []
        if (Array.isArray(suppliersData)) return suppliersData
        if ('data' in suppliersData && Array.isArray(suppliersData.data)) return suppliersData.data
        return []
    }, [suppliersData])

    const createMutation = useCreateAccountPayable()
    const updateMutation = useUpdateAccountPayable()
    const deleteMutation = useDeleteAccountPayable()

    // Calcular KPIs - Use allAccountsPayable for accurate totals
    const kpis = useMemo(() => {
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()

        let totalDebt = 0
        let paidThisMonth = 0
        let overdueCount = 0
        let authorizedCount = 0
        let activeCount = 0

        allAccountsPayable.forEach((ap: AccountPayable) => {
            // Safe number conversion
            const total = Number(ap.monto || 0)
            const paid = Number(ap.montoPagado || 0)
            // If montoRestante is missing, calculate it from total - paid
            const remaining = (ap.montoRestante !== undefined && ap.montoRestante !== null)
                ? Number(ap.montoRestante)
                : (total - paid)

            const dueDate = new Date(ap.fechaVencimiento)

            // Skip cancelled items for most metrics
            if (ap.status === 'CANCELLED') return

            activeCount++

            // Total Debt (Pending Amount)
            if (ap.status !== 'PAID') {
                totalDebt += remaining
            }

            // Paid This Month (Estimate based on updatedAt)
            if (paid > 0) {
                const updatedDate = new Date(ap.updatedAt || ap.createdAt || '')
                if (updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear) {
                    paidThisMonth += paid
                }
            }

            // Overdue Count
            // Check explicit status OR calculated overdue
            if (ap.status === 'OVERDUE' || (ap.status !== 'PAID' && dueDate < today)) {
                overdueCount++
            }

            // Authorized Count
            if (ap.autorizado) {
                authorizedCount++
            }
        })

        const authorizationRate = activeCount > 0
            ? (authorizedCount / activeCount) * 100
            : 0

        return {
            totalDebt,
            paidThisMonth,
            overdueCount,
            authorizationRate
        }
    }, [allAccountsPayable])



    const handleCreate = () => {
        setSelectedAP(null)
        setFormSupplierId('')
        setFechaVencimiento(undefined)
        setIsDialogOpen(true)
    }

    const handleEdit = (ap: AccountPayable) => {
        setSelectedAP(ap)
        setFormSupplierId(ap.supplierId || '')
        setFechaVencimiento(ap.fechaVencimiento ? new Date(ap.fechaVencimiento) : undefined)
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const notas = formData.get('notas') as string

        if (!fechaVencimiento) {
            toast.error('Seleccione una fecha de vencimiento')
            return
        }

        const data: any = {
            concepto: formData.get('concepto') as string,
            monto: parseFloat(formData.get('monto') as string),
            fechaVencimiento: fechaVencimiento.toISOString(),
        }

        if (formSupplierId && formSupplierId !== '') data.supplierId = formSupplierId
        if (notas && notas.trim() !== '') data.notas = notas

        try {
            if (selectedAP) {
                await updateMutation.mutateAsync({ id: selectedAP.id, data })
                toast.success('Cuenta por pagar actualizada correctamente')
            } else {
                await createMutation.mutateAsync(data)
                toast.success('Cuenta por pagar creada correctamente')
            }
            setIsDialogOpen(false)
            refetch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ocurrió un error')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta cuenta por pagar?')) return
        try {
            await deleteMutation.mutateAsync(id)
            toast.success('Cuenta por pagar eliminada correctamente')
            refetch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ocurrió un error')
        }
    }

    const openPaymentDialog = (ap: AccountPayable) => {
        setSelectedAP(ap)
        setPaymentAmount('')
        setIsPaymentDialogOpen(true)
    }

    const handlePayment = async () => {
        if (!selectedAP || !paymentAmount) return

        const amount = parseFloat(paymentAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error('Ingresa un monto válido')
            return
        }

        if (amount > (selectedAP.montoRestante || 0)) {
            toast.error('El monto no puede ser mayor a la deuda restante')
            return
        }

        try {
            const newPaid = (selectedAP.montoPagado || 0) + amount
            const newRemaining = (selectedAP.montoRestante || 0) - amount
            const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL'

            await updateMutation.mutateAsync({
                id: selectedAP.id,
                data: {
                    montoPagado: newPaid,
                    montoRestante: newRemaining,
                    status: newStatus
                }
            })

            toast.success('Pago registrado correctamente')
            setIsPaymentDialogOpen(false)
            refetch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ocurrió un error')
        }
    }

    const calculatePaymentProgress = (ap: AccountPayable) => {
        if (!ap.monto) return 0
        const paid = ap.montoPagado || 0
        return (paid / ap.monto) * 100
    }

    const formatCurrency = (value: any) => {
        const num = parseFloat(value)
        if (isNaN(num)) return '$0.00'
        return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
                </div>
                <Button onClick={handleCreate} className="hidden md:flex">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('create')}
                </Button>
                <Button onClick={handleCreate} size="icon" className="md:hidden">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Deuda Total
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(kpis.totalDebt)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Pendiente de pago
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Pagado este Mes
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(kpis.paidThisMonth)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Total de pagos realizados
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Facturas Vencidas
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {kpis.overdueCount}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Requieren atención inmediata
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            % Autorización
                        </CardTitle>
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {kpis.authorizationRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Cuentas autorizadas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Content */}
            <Card className="flex-1 overflow-hidden border-0 shadow-sm bg-transparent">
                <div className="h-full overflow-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <APDataTable
                        data={allAccountsPayable}
                        isLoading={isLoading}
                        onRowClick={(id) => setSelectedAPId(id)}
                    />
                </div>
            </Card>


            {/* Details Panel Sheet */}
            <Sheet open={!!selectedAPId} onOpenChange={(open) => !open && setSelectedAPId(null)}>
                <SheetContent 
                    side="right"
                    className="p-0 border-l border-gray-200 dark:border-gray-800 overflow-y-auto"
                    style={{ 
                        width: 'min(95vw, 800px)',
                        maxWidth: '800px'
                    }}
                >
                    <SheetTitle className="hidden">Detalles de Cuenta por Pagar</SheetTitle>
                    {selectedAPId && (
                        <APDetailsPanel
                            apId={selectedAPId}
                            onClose={() => setSelectedAPId(null)}
                            onEdit={(ap) => {
                                setSelectedAPId(null);
                                handleEdit(ap);
                            }}
                        />
                    )}
                </SheetContent>
            </Sheet>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedAP ? 'Editar Cuenta por Pagar' : 'Nueva Cuenta por Pagar'}</DialogTitle>
                        <DialogDescription>
                            Complete los datos de la obligación financiera
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="supplierId">Proveedor (Opcional)</Label>
                                <Select value={formSupplierId || undefined} onValueChange={setFormSupplierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar proveedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier: any) => (
                                            <SelectItem key={supplier.id} value={supplier.id}>
                                                {supplier.nombre} {supplier.rfc ? `(${supplier.rfc})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formSupplierId && suppliers.find((s: any) => s.id === formSupplierId) && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                                        <div className="font-medium mb-1">Datos del Proveedor:</div>
                                        <div>RFC: {suppliers.find((s: any) => s.id === formSupplierId)?.rfc || 'N/A'}</div>
                                        <div>Email: {suppliers.find((s: any) => s.id === formSupplierId)?.email || 'N/A'}</div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="concepto">Concepto *</Label>
                                <Input
                                    id="concepto"
                                    name="concepto"
                                    required
                                    defaultValue={selectedAP?.concepto}
                                    placeholder="Descripción del servicio o producto"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monto">Monto *</Label>
                                    <Input
                                        id="monto"
                                        name="monto"
                                        type="number"
                                        step="0.01"
                                        required
                                        defaultValue={selectedAP?.monto}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                                    <DatePicker
                                        date={fechaVencimiento}
                                        onDateChange={setFechaVencimiento}
                                        placeholder="Seleccionar fecha de vencimiento"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notas">Notas</Label>
                                <Textarea
                                    id="notas"
                                    name="notas"
                                    defaultValue={selectedAP?.notas}
                                    placeholder="Información adicional..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registrar Pago</DialogTitle>
                        <DialogDescription>
                            Abona un pago parcial o total a esta cuenta
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAP && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Proveedor:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{selectedAP.supplier?.nombre || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Concepto:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{selectedAP.concepto}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Deuda restante:</span>
                                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                        ${parseFloat(selectedAP.montoRestante as any).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentAmount">Monto a Pagar *</Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    max={selectedAP.montoRestante}
                                />
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPaymentAmount(String(selectedAP.montoRestante))}
                                    >
                                        Pagar Total
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPaymentAmount(String((selectedAP.montoRestante || 0) / 2))}
                                    >
                                        50%
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handlePayment}
                            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                        >
                            Registrar Pago
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
