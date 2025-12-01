"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Search, Calendar, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { AccountPayable, useDeleteAccountPayable } from "@/hooks/useFinance";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface APDataTableProps {
    data: AccountPayable[];
    isLoading: boolean;
    onRowClick?: (id: string) => void;
}

export function APDataTable({ data, isLoading, onRowClick }: APDataTableProps) {
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("ACTIVE");
    const [sortOrder, setSortOrder] = React.useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
    const deleteAP = useDeleteAccountPayable();
    const [apToDelete, setApToDelete] = React.useState<string | null>(null);
    const [expandedMonths, setExpandedMonths] = React.useState<Set<string>>(new Set());

    // Filter and Sort Data
    const processedData = React.useMemo(() => {
        let filtered = data.filter((item) => {
            const matchesSearch = item.concepto.toLowerCase().includes(search.toLowerCase()) ||
                item.supplier?.nombre.toLowerCase().includes(search.toLowerCase());

            let matchesStatus = true;
            if (statusFilter === "ACTIVE") {
                matchesStatus = item.status !== "PAID" && item.status !== "CANCELLED";
            } else if (statusFilter !== "ALL") {
                matchesStatus = item.status === statusFilter;
            }

            return matchesSearch && matchesStatus;
        });

        // Sort
        return filtered.sort((a, b) => {
            switch (sortOrder) {
                case "date-desc":
                    return new Date(b.fechaVencimiento).getTime() - new Date(a.fechaVencimiento).getTime();
                case "date-asc":
                    return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
                case "amount-desc":
                    return (b.monto || 0) - (a.monto || 0);
                case "amount-asc":
                    return (a.monto || 0) - (b.monto || 0);
                default:
                    return 0;
            }
        });
    }, [data, search, statusFilter, sortOrder]);

    // Group by Month
    const groupedData = React.useMemo(() => {
        const groups: Record<string, AccountPayable[]> = {};

        processedData.forEach(item => {
            const date = new Date(item.fechaVencimiento);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        // Sort groups keys based on sortOrder (if date sort) or just desc date by default
        return Object.entries(groups).sort(([keyA], [keyB]) => {
            if (sortOrder === 'date-asc') return keyA.localeCompare(keyB);
            return keyB.localeCompare(keyA);
        });
    }, [processedData, sortOrder]);

    // Auto-expand current month or first month
    React.useEffect(() => {
        if (groupedData.length > 0 && expandedMonths.size === 0) {
            setExpandedMonths(new Set([groupedData[0][0]]));
        }
    }, [groupedData.length]);

    const toggleMonth = (monthKey: string) => {
        const newExpanded = new Set(expandedMonths);
        if (newExpanded.has(monthKey)) {
            newExpanded.delete(monthKey);
        } else {
            newExpanded.add(monthKey);
        }
        setExpandedMonths(newExpanded);
    };

    const handleDelete = async () => {
        if (!apToDelete) return;
        try {
            await deleteAP.mutateAsync(apToDelete);
            toast.success("Cuenta por pagar eliminada correctamente");
            setApToDelete(null);
        } catch (error) {
            toast.error("Error al eliminar la cuenta por pagar");
        }
    };

    if (isLoading) {
        return <APTableSkeleton />;
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg bg-muted/10">
                <DollarSign className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hay cuentas por pagar</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Comienza creando una nueva obligación financiera.
                </p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300';
            case 'PARTIAL': return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
            case 'OVERDUE': return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300';
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

    const getMonthLabel = (dateStr: string) => {
        const [year, month] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-1">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por concepto o proveedor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ACTIVE">Activas</SelectItem>
                            <SelectItem value="ALL">Todas</SelectItem>
                            <SelectItem value="PENDING">Por Pagar</SelectItem>
                            <SelectItem value="PARTIAL">Pago Parcial</SelectItem>
                            <SelectItem value="PAID">Pagada</SelectItem>
                            <SelectItem value="OVERDUE">Vencida</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Orden" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-desc">Más recientes</SelectItem>
                            <SelectItem value="date-asc">Más antiguas</SelectItem>
                            <SelectItem value="amount-desc">Mayor monto</SelectItem>
                            <SelectItem value="amount-asc">Menor monto</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-gray-900 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[300px]">Concepto y Proveedor</TableHead>
                            <TableHead>Fecha Vencimiento</TableHead>
                            <TableHead className="text-right">Monto Total</TableHead>
                            <TableHead className="text-right">Pagado</TableHead>
                            <TableHead className="text-right">Restante</TableHead>
                            <TableHead className="text-center">Autorizado</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupedData.map(([monthKey, items]) => (
                            <React.Fragment key={monthKey}>
                                <TableRow
                                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                                    onClick={() => toggleMonth(monthKey)}
                                >
                                    <TableCell colSpan={8} className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {expandedMonths.has(monthKey) ? (
                                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className="capitalize text-slate-900 dark:text-slate-100">{getMonthLabel(monthKey)}</span>
                                            <Badge variant="outline" className="ml-2 bg-white dark:bg-slate-900">
                                                {items.length}
                                            </Badge>
                                            <span className="ml-auto text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                Total: {formatCurrency(items.reduce((sum, item) => sum + Number(item.monto || 0), 0))}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {expandedMonths.has(monthKey) && items.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        onClick={() => onRowClick?.(item.id)}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{item.concepto}</span>
                                                {item.supplier && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.supplier.nombre}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>{formatDate(item.fechaVencimiento)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(item.monto || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 dark:text-green-400">
                                            {formatCurrency(item.montoPagado || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600 dark:text-red-400 font-medium">
                                            {formatCurrency(item.montoRestante || 0)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.autorizado ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Sí
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                                    No
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className={getStatusColor(item.status)}>
                                                {getStatusLabel(item.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRowClick?.(item.id);
                                                    }}>
                                                        Ver Detalles
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setApToDelete(item.id);
                                                        }}
                                                    >
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!apToDelete} onOpenChange={(open) => !open && setApToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Registro</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar esta cuenta por pagar? Esta acción no se puede deshacer.
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

function APTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-[250px]" />
                <Skeleton className="h-9 w-[100px]" />
            </div>
            <div className="rounded-md border">
                <div className="p-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-3 w-[150px]" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
