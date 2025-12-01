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
import { MoreHorizontal, Search, Calendar, DollarSign, Filter } from "lucide-react";
import { FixedCost, useDeleteFixedCost } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
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

interface FixedCostDataTableProps {
    data: FixedCost[];
    isLoading: boolean;
    onRowClick?: (id: string) => void;
}

export function FixedCostDataTable({ data, isLoading, onRowClick }: FixedCostDataTableProps) {
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const deleteFixedCost = useDeleteFixedCost();
    const [fixedCostToDelete, setFixedCostToDelete] = React.useState<string | null>(null);

    const filteredData = React.useMemo(() => {
        return data.filter((item) => {
            const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.category?.nombre.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "active" ? item.isActive : !item.isActive);
            return matchesSearch && matchesStatus;
        });
    }, [data, search, statusFilter]);

    const handleDelete = async () => {
        if (!fixedCostToDelete) return;
        try {
            await deleteFixedCost.mutateAsync(fixedCostToDelete);
            toast.success("Fixed cost deleted successfully");
            setFixedCostToDelete(null);
        } catch (error) {
            toast.error("Failed to delete fixed cost");
        }
    };

    if (isLoading) {
        return <FixedCostTableSkeleton />;
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg bg-muted/10">
                <DollarSign className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No fixed costs found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Get started by creating a new fixed cost.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-4 p-1">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search fixed costs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[300px]">Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Day of Month</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((fixedCost) => (
                            <TableRow
                                key={fixedCost.id}
                                onClick={() => onRowClick?.(fixedCost.id)}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{fixedCost.title}</span>
                                        {fixedCost.description && (
                                            <span className="text-xs text-muted-foreground line-clamp-1">
                                                {fixedCost.description}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {fixedCost.category && (
                                        <Badge variant="outline" style={{
                                            borderColor: fixedCost.category.color,
                                            color: fixedCost.category.color
                                        }}>
                                            {fixedCost.category.nombre}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Day {fixedCost.dayOfMonth}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(fixedCost.amount)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={fixedCost.isActive ? "default" : "secondary"} className={fixedCost.isActive ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300" : ""}>
                                        {fixedCost.isActive ? "Active" : "Inactive"}
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
                                                onRowClick?.(fixedCost.id);
                                            }}>
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFixedCostToDelete(fixedCost.id);
                                                }}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!fixedCostToDelete} onOpenChange={(open) => !open && setFixedCostToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Fixed Cost</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this fixed cost? This action cannot be undone.
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

function FixedCostTableSkeleton() {
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
