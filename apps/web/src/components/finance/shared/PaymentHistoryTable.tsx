"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentComplement } from "@/hooks/useFinance";

interface PaymentHistoryTableProps {
    payments: PaymentComplement[];
    groupBy: 'date' | 'entity' | 'client' | 'supplier';
    entityName?: string;
}

export function PaymentHistoryTable({ payments, groupBy, entityName }: PaymentHistoryTableProps) {
    if (!payments || payments.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-muted-foreground">
                No hay pagos registrados
            </div>
        );
    }

    if (groupBy === 'date') {
        // Group by date
        const paymentsByDate = payments.reduce((acc, payment) => {
            const dateStr = payment.fechaPago || payment.date || '';
            const date = formatDate(dateStr);
            if (!acc[date]) acc[date] = [];
            acc[date].push(payment);
            return acc;
        }, {} as Record<string, PaymentComplement[]>);

        const sortedDates = Object.keys(paymentsByDate).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        return (
            <div className="space-y-5">
                {sortedDates.map((date) => (
                    <div key={date} className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b">
                            <h4 className="text-sm font-semibold text-foreground">
                                {date}
                            </h4>
                            <Badge variant="secondary" className="text-xs px-2.5 py-1">
                                {paymentsByDate[date].length} {paymentsByDate[date].length === 1 ? 'pago' : 'pagos'}
                            </Badge>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Monto
                                        </TableHead>
                                        <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Forma de Pago
                                        </TableHead>
                                        <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Referencia
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentsByDate[date].map((payment) => {
                                        const amount = payment.monto || payment.amount || 0;
                                        const paymentMethod = payment.formaPago || payment.paymentMethod || null;
                                        const paymentMethodDisplay = paymentMethod || 'No especificada';
                                        const reference = (payment as PaymentComplement & { referencia?: string }).referencia || payment.transactionId || '-';
                                        return (
                                            <TableRow key={payment.id} className="hover:bg-muted/50">
                                                <TableCell className="h-12 px-4 py-3 font-medium text-sm">
                                                    {formatCurrency(amount)}
                                                </TableCell>
                                                <TableCell className="h-12 px-4 py-3">
                                                    {paymentMethod ? (
                                                        <Badge variant="outline" className="text-xs px-2.5 py-1">
                                                            {paymentMethod}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            {paymentMethodDisplay}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="h-12 px-4 py-3 text-sm text-muted-foreground">
                                                    {reference}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Group by entity (client/supplier)
    return (
        <div className="space-y-3">
            {entityName && (
                <div className="flex items-center justify-between pb-2 border-b mb-3">
                    <h4 className="text-sm font-semibold text-foreground">
                        {entityName}
                    </h4>
                    <Badge variant="secondary" className="text-xs px-2.5 py-1">
                        {payments.length} {payments.length === 1 ? 'pago' : 'pagos'}
                    </Badge>
                </div>
            )}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Monto
                            </TableHead>
                            <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Fecha
                            </TableHead>
                            <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Concepto
                            </TableHead>
                            <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Forma de Pago
                            </TableHead>
                            <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Referencia
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => {
                            const amount = payment.monto || payment.amount || 0;
                            const dateStr = payment.fechaPago || payment.date || '';
                            const paymentMethod = payment.formaPago || payment.paymentMethod || null;
                            const paymentMethodDisplay = paymentMethod || 'No especificada';
                            const reference = (payment as PaymentComplement & { referencia?: string }).referencia || payment.transactionId || '-';
                            const concepto = payment.accountReceivable?.concepto || payment.accountPayable?.concepto || '-';
                            return (
                                <TableRow key={payment.id} className="hover:bg-muted/50">
                                    <TableCell className="h-12 px-4 py-3 font-medium text-sm">
                                        {formatCurrency(amount)}
                                    </TableCell>
                                    <TableCell className="h-12 px-4 py-3 text-sm text-muted-foreground">
                                        {formatDate(dateStr)}
                                    </TableCell>
                                    <TableCell className="h-12 px-4 py-3 text-sm text-muted-foreground">
                                        <span className="truncate block max-w-[200px]" title={concepto}>
                                            {concepto}
                                        </span>
                                    </TableCell>
                                    <TableCell className="h-12 px-4 py-3">
                                        {paymentMethod ? (
                                            <Badge variant="outline" className="text-xs px-2.5 py-1">
                                                {paymentMethod}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">
                                                {paymentMethodDisplay}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="h-12 px-4 py-3 text-sm text-muted-foreground">
                                        {reference}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

