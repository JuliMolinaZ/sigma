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
import { Search, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePaymentComplements, PaymentComplement } from "@/hooks/useFinance";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PaymentComplementDataTable() {
    const router = useRouter();
    const [search, setSearch] = React.useState("");
    const { data: complements, isLoading } = usePaymentComplements({ search });

    const filteredComplements = React.useMemo(() => {
        if (!complements) return [];
        if (!search) return complements;
        const lowerSearch = search.toLowerCase();
        return complements.filter((c: PaymentComplement) =>
            c.number?.toLowerCase().includes(lowerSearch) ||
            c.invoice?.number.toLowerCase().includes(lowerSearch) ||
            c.invoice?.client?.nombre.toLowerCase().includes(lowerSearch)
        );
    }, [complements, search]);

    if (isLoading) return <TableSkeleton />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search payments..."
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
                            <TableHead>Payment #</TableHead>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredComplements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">No results found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredComplements.map((complement: PaymentComplement) => (
                                <TableRow key={complement.id} className="group cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">{complement.number || "-"}</TableCell>
                                    <TableCell>{complement.invoice?.number || "-"}</TableCell>
                                    <TableCell>{complement.invoice?.client?.nombre || "-"}</TableCell>
                                    <TableCell>{formatDate(complement.date)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{complement.paymentMethod}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                                        {formatCurrency(Number(complement.amount))}
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
