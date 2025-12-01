"use client";

import { Suspense, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { PaymentComplementDataTable } from "@/components/finance/payment-complements/PaymentComplementDataTable";
import { PaymentComplementForm } from "@/components/finance/payment-complements/PaymentComplementForm";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

export default function PaymentComplementsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading
                    title="Payment Complements"
                    description="Manage payment complements (REP) for invoices"
                />
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Register Payment
                </Button>
            </div>
            <Separator />

            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <PaymentComplementDataTable />
            </Suspense>

            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Register Payment</SheetTitle>
                        <SheetDescription>
                            Register a payment for an existing invoice
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <PaymentComplementForm
                            onSuccess={() => setIsCreateOpen(false)}
                            onCancel={() => setIsCreateOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
