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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, Filter, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { useExpenses, useDeleteExpense } from "@/hooks/useExpenses";
import { Expense } from "@/types";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { StatusChip } from "@/components/shared/StatusChip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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

const EXPENSE_CATEGORIES = [
    "Transportation",
    "Meals",
    "Accommodation",
    "Office Supplies",
    "Software",
    "Equipment",
    "Travel",
    "Entertainment",
    "Other"
];

interface ExpenseDataTableProps {
    data?: Expense[];
    isLoading?: boolean;
    onRowClick?: (id: string) => void;
}

export function ExpenseDataTable({ data, isLoading: externalLoading, onRowClick }: ExpenseDataTableProps) {
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("");
    const [categoryFilter, setCategoryFilter] = React.useState<string>("");
    const [expenseToDelete, setExpenseToDelete] = React.useState<string | null>(null);
    const deleteExpense = useDeleteExpense();

    // If data is passed from parent, use it. Otherwise fetch it (backward compatibility or standalone usage)
    // But for this refactor, we prefer data passed from parent if possible, but the hook is here.
    // Actually, to be consistent with FixedCostDataTable refactor, let's use the hook internally if data is not provided,
    // OR just use the hook internally always if we want to keep filters working easily without lifting state up too much.
    // However, the Sprints pattern usually has the page fetching data.
    // Let's assume the page fetches data to keep it consistent with FixedCostPage refactor.

    // Wait, FixedCostDataTable refactor used `data` prop.
    // So let's use `data` prop here too.

    // If data is not provided, we might need to fetch it, but let's assume it is provided.
    // But wait, the previous implementation used useExpenses hook inside.
    // To match FixedCostDataTable, I should accept data as prop.

    // But I need to handle filtering. If data is passed, is it already filtered?
    // In FixedCostDataTable, I did client-side filtering on the passed data.
    // Let's do the same here for consistency.

    const filteredExpenses = React.useMemo(() => {
        if (!data) return [];
        return data.filter((expense) => {
            const matchesSearch =
                expense.description.toLowerCase().includes(search.toLowerCase()) ||
                expense.user?.firstName.toLowerCase().includes(search.toLowerCase()) ||
                expense.user?.lastName.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = !statusFilter || statusFilter === "all" || expense.status === statusFilter;
            const matchesCategory = !categoryFilter || categoryFilter === "all" || expense.category === categoryFilter;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [data, search, statusFilter, categoryFilter]);

    const handleDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await deleteExpense.mutateAsync(expenseToDelete);
            toast.success("Expense deleted successfully");
            setExpenseToDelete(null);
        } catch (error) {
            toast.error("Failed to delete expense");
        }
    };

    if (externalLoading) return <ExpenseTableSkeleton />;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search expenses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-full sm:w-[250px] pl-8"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 w-full sm:w-[150px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="SUBMITTED">Submitted</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="REIMBURSED">Reimbursed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-9 w-full sm:w-[150px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto">
                    <FileText className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[300px]">Description & User</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>
                                <div className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                                    Date
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredExpenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <FileText className="h-8 w-8 mb-2 opacity-20" />
                                        <p>No expenses found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredExpenses.map((expense: Expense) => (
                                <TableRow
                                    key={expense.id}
                                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => onRowClick?.(expense.id)}
                                >
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-foreground">{expense.description}</span>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={expense.user?.avatarUrl || `https://avatar.vercel.sh/${expense.user?.firstName}.png`} />
                                                    <AvatarFallback className="text-[9px]">{getInitials(expense.user?.firstName || "?", expense.user?.lastName || "")}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground">
                                                    {expense.user ? `${expense.user.firstName} ${expense.user.lastName}` : "Unknown User"}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal">
                                            {expense.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(expense.date)}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {expense.project?.name || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm font-medium">
                                        {formatCurrency(expense.amount, expense.currency)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <StatusChip status={expense.status} />
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRowClick?.(expense.id);
                                                }}>
                                                    View details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpenseToDelete(expense.id);
                                                    }}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this expense? This action cannot be undone.
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

function ExpenseTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Skeleton className="h-9 w-[250px]" />
                    <Skeleton className="h-9 w-[150px]" />
                    <Skeleton className="h-9 w-[150px]" />
                </div>
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
    );
}
