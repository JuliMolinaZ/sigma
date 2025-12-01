"use client";

import { Suspense, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { InvoiceDataTable } from "@/components/finance/invoices/InvoiceDataTable";
import { InvoiceStatsCards } from "@/components/finance/invoices/InvoiceStatsCards";
import { InvoiceForm } from "@/components/finance/invoices/InvoiceForm";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

export default function InvoicesPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading
                    title="Invoices"
                    description="Manage your invoices and track payments"
                />
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Invoice
                </Button>
            </div>
            <Separator />

            <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>}>
                <InvoiceStatsCards />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <InvoiceDataTable />
            </Suspense>

            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Create Invoice</SheetTitle>
                        <SheetDescription>
                            Create a new invoice for a client
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <InvoiceForm
                            onSuccess={() => setIsCreateOpen(false)}
                            onCancel={() => setIsCreateOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
