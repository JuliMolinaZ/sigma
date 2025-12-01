"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { useInvoices, PaymentComplement } from "@/hooks/useFinance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const paymentComplementSchema = z.object({
    invoiceId: z.string().min(1, "Invoice is required"),
    date: z.string().min(1, "Date is required"),
    amount: z.any()
        .transform((val: any) => Number(val))
        .pipe(z.number().min(0.01, "Amount must be greater than 0")),
    paymentMethod: z.string().min(1, "Payment method is required"),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
});

type PaymentComplementFormData = z.infer<typeof paymentComplementSchema>;

interface PaymentComplementFormProps {
    complement?: PaymentComplement;
    preselectedInvoiceId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PaymentComplementForm({
    complement,
    preselectedInvoiceId,
    onSuccess,
    onCancel
}: PaymentComplementFormProps) {
    const queryClient = useQueryClient();
    // Fetch only unpaid or partial invoices ideally, but for now fetching all
    const { data: invoices } = useInvoices();

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post("/finance/payment-complements", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-complements"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] }); // Invoices status might change
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.put(`/finance/payment-complements/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-complements"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
    });

    const form = useForm({
        resolver: zodResolver(paymentComplementSchema),
        defaultValues: {
            invoiceId: complement?.invoiceId || preselectedInvoiceId || "",
            date: complement?.date
                ? new Date(complement.date).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            amount: complement?.amount ? Number(complement.amount) : 0,
            paymentMethod: complement?.paymentMethod || "TRANSFER",
            transactionId: complement?.transactionId || "",
            notes: complement?.notes || "",
        },
    });

    const onSubmit = async (data: PaymentComplementFormData) => {
        try {
            const payload = {
                ...data,
                date: new Date(data.date).toISOString(),
            };

            if (complement?.id) {
                await updateMutation.mutateAsync({ id: complement.id, data: payload });
                toast.success("Payment complement updated successfully");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("Payment complement created successfully");
            }
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save payment complement");
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="invoiceId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Invoice *</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={!!preselectedInvoiceId}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select invoice" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {invoices?.map((invoice: any) => (
                                        <SelectItem key={invoice.id} value={invoice.id}>
                                            {invoice.number} - {invoice.client?.nombre} ({invoice.status})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Date *</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount *</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0.01" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Method *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="TRANSFER">Transfer (SPEI)</SelectItem>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="CHECK">Check</SelectItem>
                                        <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="transactionId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transaction ID (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. SPEI Tracking Key" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Additional details..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {complement ? "Update Payment" : "Register Payment"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
