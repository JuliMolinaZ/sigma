"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AccountPayable } from "@/hooks/useFinance"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface GetColumnsProps {
    onDelete: (id: string) => void
    onView: (id: string) => void
}

export const getColumns = ({ onDelete, onView }: GetColumnsProps): ColumnDef<AccountPayable>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "concepto",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Concept" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[200px]">{row.getValue("concepto")}</span>
                    <span className="text-xs text-muted-foreground">{row.original.supplier?.nombre}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "fechaVencimiento",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Due Date" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex w-[100px] items-center">
                    <span>{formatDate(row.getValue("fechaVencimiento"))}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "monto",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Amount" className="justify-end" />
        ),
        cell: ({ row }) => {
            return (
                <div className="text-right font-medium">
                    {formatCurrency(row.getValue("monto"))}
                </div>
            )
        },
    },
    {
        accessorKey: "montoPagado",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Paid" className="justify-end" />
        ),
        cell: ({ row }) => {
            return (
                <div className="text-right text-green-600 dark:text-green-400">
                    {formatCurrency(row.getValue("montoPagado"))}
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" className="justify-center" />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            let colorClass = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"

            if (status === 'PAID') colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            if (status === 'PARTIAL') colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            if (status === 'OVERDUE') colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            if (status === 'PENDING') colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'

            return (
                <div className="flex justify-center">
                    <Badge variant="secondary" className={colorClass}>
                        {status}
                    </Badge>
                </div>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const payment = row.original

            return (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(payment.id)}
                            >
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onView(payment.id)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDelete(payment.id)}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
