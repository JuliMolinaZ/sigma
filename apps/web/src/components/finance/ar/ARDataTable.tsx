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
import { MoreHorizontal, Search, FileText, Filter, ArrowUpDown, DollarSign, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { AccountReceivable, useDeleteAccountReceivable } from "@/hooks/useFinance";
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

interface ARDataTableProps {
    data: AccountReceivable[];
    isLoading: boolean;
    onRowClick?: (id: string) => void;
}

export function ARDataTable({ data, isLoading, onRowClick }: ARDataTableProps) {
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [sortOrder, setSortOrder] = React.useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
    const deleteAR = useDeleteAccountReceivable();
    const [arToDelete, setArToDelete] = React.useState<string | null>(null);
    const [expandedMonths, setExpandedMonths] = React.useState<Set<string>>(new Set());

    // Filter and Sort Data
    const processedData = React.useMemo(() => {
        let filtered = data.filter((item) => {
            const matchesSearch = item.concepto.toLowerCase().includes(search.toLowerCase()) ||
                item.client?.nombre.toLowerCase().includes(search.toLowerCase());

            let matchesStatus = true;
            if (statusFilter !== "all") {
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
        const groups: Record<string, AccountReceivable[]> = {};

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
        if (!arToDelete) return;
        try {
            await deleteAR.mutateAsync(arToDelete);
            toast.success("Record deleted successfully");
            setArToDelete(null);
        } catch (error) {
            toast.error("Failed to delete record");
        }
    };

    if (isLoading) {
        return <ARTableSkeleton />;
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg bg-muted/10">
                <DollarSign className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No records found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Get started by creating a new account receivable.
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
                        placeholder="Search records..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PARTIAL">Partial</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-desc">Newest first</SelectItem>
                            <SelectItem value="date-asc">Oldest first</SelectItem>
                            <SelectItem value="amount-desc">Highest amount</SelectItem>
                            <SelectItem value="amount-asc">Lowest amount</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-gray-900 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[300px]">Concept & Client</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Remaining</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupedData.map(([monthKey, items]) => (
                            <React.Fragment key={monthKey}>
                                <TableRow
                                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                                    onClick={() => toggleMonth(monthKey)}
                                >
                                    <TableCell colSpan={7} className="font-medium">
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
                                                {item.client && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.client.nombre}
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
                                            {formatCurrency(item.monto)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 dark:text-green-400">
                                            {formatCurrency(item.montoPagado)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600 dark:text-red-400 font-medium">
                                            {formatCurrency(item.montoRestante)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className={getStatusColor(item.status)}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRowClick?.(item.id);
                                                    }}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setArToDelete(item.id);
                                                        }}
                                                    >
                                                        Delete
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

            <AlertDialog open={!!arToDelete} onOpenChange={(open) => !open && setArToDelete(null)}>
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

function ARTableSkeleton() {
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
