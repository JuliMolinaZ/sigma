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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, Calendar, User } from "lucide-react";
import { usePaymentComplements, PaymentComplement } from "@/hooks/useFinance";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ViewMode = 'date' | 'client';

export function PaymentComplementDataTable() {
    const [search, setSearch] = React.useState("");
    const [viewMode, setViewMode] = React.useState<ViewMode>('date');
    const { data: complements, isLoading } = usePaymentComplements({ search });

    const filteredComplements = React.useMemo(() => {
        if (!complements) return [];
        if (!search) return complements;
        const lowerSearch = search.toLowerCase();
        return complements.filter((c: PaymentComplement) => {
            const number = c.number?.toLowerCase() || '';
            const invoiceNumber = c.invoice?.number?.toLowerCase() || '';
            const clientName = c.invoice?.client?.nombre?.toLowerCase() || 
                            c.accountReceivable?.client?.nombre?.toLowerCase() ||
                            c.accountPayable?.supplier?.nombre?.toLowerCase() || '';
            const arConcepto = c.accountReceivable?.concepto?.toLowerCase() || '';
            const apConcepto = c.accountPayable?.concepto?.toLowerCase() || '';
            
            return number.includes(lowerSearch) ||
                   invoiceNumber.includes(lowerSearch) ||
                   clientName.includes(lowerSearch) ||
                   arConcepto.includes(lowerSearch) ||
                   apConcepto.includes(lowerSearch);
        });
    }, [complements, search]);

    // Agrupar por fecha o cliente según el modo de vista
    const groupedData = React.useMemo(() => {
        if (!filteredComplements || filteredComplements.length === 0) return {};

        if (viewMode === 'date') {
            // Agrupar por fecha
            const grouped: Record<string, PaymentComplement[]> = {};
            filteredComplements.forEach((complement: PaymentComplement) => {
                const date = formatDate(complement.date || complement.fechaPago || '');
                if (!grouped[date]) grouped[date] = [];
                grouped[date].push(complement);
            });
            return grouped;
        } else {
            // Agrupar por cliente/proveedor
            const grouped: Record<string, PaymentComplement[]> = {};
            filteredComplements.forEach((complement: PaymentComplement) => {
                const clientName = complement.invoice?.client?.nombre || 
                                  complement.accountReceivable?.client?.nombre ||
                                  complement.accountPayable?.supplier?.nombre ||
                                  'Sin Cliente/Proveedor';
                if (!grouped[clientName]) grouped[clientName] = [];
                grouped[clientName].push(complement);
            });
            return grouped;
        }
    }, [filteredComplements, viewMode]);

    // Ordenar las claves (fechas o clientes)
    const sortedKeys = React.useMemo(() => {
        const keys = Object.keys(groupedData);
        if (viewMode === 'date') {
            // Ordenar fechas de más reciente a más antigua
            return keys.sort((a, b) => {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateB.getTime() - dateA.getTime();
            });
        } else {
            // Ordenar clientes alfabéticamente
            return keys.sort((a, b) => a.localeCompare(b));
        }
    }, [groupedData, viewMode]);

    if (isLoading) return <TableSkeleton />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search payments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-[250px] pl-8"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'date' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('date')}
                            className="h-9"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Por Fecha
                        </Button>
                        <Button
                            variant={viewMode === 'client' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('client')}
                            className="h-9"
                        >
                            <User className="w-4 h-4 mr-2" />
                            Por Cliente
                        </Button>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="h-9">
                    <FileText className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            {sortedKeys.length === 0 ? (
                <div className="rounded-md border bg-card p-8 text-center">
                    <p className="text-muted-foreground">No se encontraron pagos.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedKeys.map((key) => {
                        const groupPayments = groupedData[key];
                        const totalAmount = groupPayments.reduce(
                            (sum, p) => sum + Number(p.amount || p.monto || 0),
                            0
                        );

                        return (
                            <Card key={key}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {viewMode === 'date' ? (
                                                <>
                                                    <Calendar className="w-4 h-4" />
                                                    {key}
                                                </>
                                            ) : (
                                                <>
                                                    <User className="w-4 h-4" />
                                                    {key}
                                                </>
                                            )}
                                        </CardTitle>
                                        <Badge variant="secondary" className="text-xs">
                                            {groupPayments.length} {groupPayments.length === 1 ? 'pago' : 'pagos'} • {formatCurrency(totalAmount)}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="rounded-md border-t">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                    <TableHead>Payment #</TableHead>
                                                    <TableHead>Invoice</TableHead>
                                                    {viewMode === 'date' && <TableHead>Client</TableHead>}
                                                    {viewMode === 'client' && <TableHead>Date</TableHead>}
                                                    <TableHead>Method</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {groupPayments.map((complement: PaymentComplement) => (
                                                    <TableRow key={complement.id} className="group cursor-pointer hover:bg-muted/50">
                                                        <TableCell className="font-medium">{complement.number || "-"}</TableCell>
                                                        <TableCell>
                                                            {complement.invoice?.number || 
                                                             (complement.accountReceivable ? `AR: ${complement.accountReceivable.concepto.substring(0, 30)}${complement.accountReceivable.concepto.length > 30 ? '...' : ''}` : 
                                                              complement.accountPayable ? `AP: ${complement.accountPayable.concepto.substring(0, 30)}${complement.accountPayable.concepto.length > 30 ? '...' : ''}` : "-")}
                                                        </TableCell>
                                                        {viewMode === 'date' && (
                                                            <TableCell>
                                                                {complement.invoice?.client?.nombre || 
                                                                 complement.accountReceivable?.client?.nombre || 
                                                                 complement.accountPayable?.supplier?.nombre || 
                                                                 "-"}
                                                            </TableCell>
                                                        )}
                                                        {viewMode === 'client' && (
                                                            <TableCell>{formatDate(complement.date || complement.fechaPago || '')}</TableCell>
                                                        )}
                                                        <TableCell>
                                                            <Badge variant="outline">{complement.paymentMethod || complement.formaPago || "TRANSFER"}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                                                            {formatCurrency(Number(complement.amount || complement.monto || 0))}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function TableSkeleton() {
    return <Skeleton className="h-[400px] w-full" />
}
