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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Search, FileText, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSuppliers, Supplier } from "@/hooks/useSuppliers";
import { getInitials } from "@/lib/utils";

export function SupplierDataTable() {
    const router = useRouter();
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("ALL");

    // Use the hook
    const { data: response, isLoading } = useSuppliers({ search });
    const suppliers = Array.isArray(response) ? response : (response?.data || []);

    const filteredSuppliers = React.useMemo(() => {
        if (!suppliers) return [];
        let result = suppliers;

        if (statusFilter !== "ALL") {
            const isActive = statusFilter === "ACTIVE";
            result = result.filter((s: Supplier) => s.isActive === isActive);
        }

        // Client-side search if API doesn't handle it fully yet
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter((s: Supplier) =>
                s.nombre.toLowerCase().includes(lowerSearch) ||
                s.rfc?.toLowerCase().includes(lowerSearch) ||
                s.email?.toLowerCase().includes(lowerSearch)
            );
        }

        return result;
    }, [suppliers, search, statusFilter]);

    if (isLoading) {
        return <SupplierTableSkeleton />;
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search suppliers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-[250px] pl-8"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 w-[150px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-9">
                        <FileText className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[300px]">SUPPLIER</TableHead>
                            <TableHead>CONTACT</TableHead>
                            <TableHead>EMAIL</TableHead>
                            <TableHead>PHONE</TableHead>
                            <TableHead>STATUS</TableHead>
                            <TableHead className="text-right">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSuppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSuppliers.map((supplier: Supplier) => (
                                <TableRow key={supplier.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/suppliers/${supplier.id}`)}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={`https://avatar.vercel.sh/${supplier.nombre}.png`} />
                                                <AvatarFallback>{getInitials(supplier.nombre, "")}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{supplier.nombre}</span>
                                                <span className="text-xs text-muted-foreground">{supplier.runProveedor || "-"}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{supplier.contacto || "-"}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">{supplier.email || "-"}</span>
                                    </TableCell>
                                    <TableCell>
                                        {supplier.telefono ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`https://wa.me/${supplier.telefono?.replace(/\D/g, '')}`, '_blank');
                                                }}
                                            >
                                                <span className="mr-2">{supplier.telefono}</span>
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    width="16"
                                                    height="16"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="w-4 h-4"
                                                >
                                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                </svg>
                                            </Button>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={supplier.isActive ? "default" : "secondary"}
                                            className={supplier.isActive ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400" : "text-muted-foreground"}
                                        >
                                            {supplier.isActive ? "Active" : "Inactive"}
                                        </Badge>
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
                                                <DropdownMenuItem onClick={() => router.push(`/suppliers/${supplier.id}`)}>
                                                    View details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Edit supplier</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">
                                                    Delete supplier
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
        </div>
    );
}

function SupplierTableSkeleton() {
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
