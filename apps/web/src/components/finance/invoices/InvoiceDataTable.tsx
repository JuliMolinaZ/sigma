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
import { Search, FileText, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useInvoices, Invoice } from "@/hooks/useFinance";
import { formatCurrency, formatDate } from "@/lib/utils";

export function InvoiceDataTable() {
    const router = useRouter();
    const [search, setSearch] = React.useState("");
    const { data: invoices, isLoading } = useInvoices({ search });

    const filteredInvoices = React.useMemo(() => {
        if (!invoices) return [];
        if (!search) return invoices;
        const lowerSearch = search.toLowerCase();
        return invoices.filter((i: Invoice) =>
            i.number.toLowerCase().includes(lowerSearch) ||
            i.client?.nombre.toLowerCase().includes(lowerSearch)
        );
    }, [invoices, search]);

    if (isLoading) return <TableSkeleton />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search invoices..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-[250px] pl-8"
                    />
                </div>
                <Button variant="outline" size="sm" className="h-9">
                    <FileText className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>Number</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Issue Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">No results found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((invoice: Invoice) => (
                                <TableRow key={invoice.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/finance/invoices/${invoice.id}`)}>
                                    <TableCell className="font-medium font-mono">{invoice.number}</TableCell>
                                    <TableCell>{invoice.client?.nombre || "-"}</TableCell>
                                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(Number(invoice.amount))}</TableCell>
                                    <TableCell>
                                        <Badge variant={invoice.status === 'PAID' ? 'default' : invoice.status === 'OVERDUE' ? 'destructive' : 'secondary'}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); /* Download logic */ }}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function TableSkeleton() {
    return <Skeleton className="h-[400px] w-full" />
}
