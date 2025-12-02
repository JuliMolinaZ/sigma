"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from 'sonner';
import { useClients } from "@/hooks/useClients";
import { Quote } from "@/hooks/useFinance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";

const quoteItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be positive"),
});

const quoteSchema = z.object({
    number: z.string().min(1, "Quote number is required"),
    clientId: z.string().min(1, "Client is required"),
    date: z.string().min(1, "Date is required"),
    validUntil: z.string().min(1, "Valid until date is required"),
    status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
    items: z.array(quoteItemSchema).min(1, "At least one item is required"),
    notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
    quote?: Quote;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function QuoteForm({ quote, onSuccess, onCancel }: QuoteFormProps) {
    const queryClient = useQueryClient();
    const { data: clients } = useClients({ limit: 100 });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post("/finance/quotes", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.put(`/finance/quotes/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
        },
    });

    const form = useForm({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            number: quote?.number || "",
            clientId: quote?.client?.id || quote?.clientId || "",
            date: quote?.date
                ? new Date(quote.date).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            validUntil: quote?.validUntil
                ? new Date(quote.validUntil).toISOString().split('T')[0]
                : "",
            status: quote?.status || "DRAFT",
            items: quote?.items?.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            })) || [{ description: "", quantity: 1, unitPrice: 0 }],
            notes: quote?.notes || "",
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchItems = form.watch("items");
    const totalAmount = watchItems.reduce((sum, item) => {
        return sum + (Number(item.quantity) * Number(item.unitPrice));
    }, 0);

    const onSubmit = async (data: QuoteFormData) => {
        try {
            const payload = {
                ...data,
                amount: totalAmount,
                date: new Date(data.date).toISOString(),
                validUntil: new Date(data.validUntil).toISOString(),
            };

            if (quote?.id) {
                await updateMutation.mutateAsync({ id: quote.id, data: payload });
                toast.success("Quote updated successfully");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("Quote created successfully");
            }

            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save quote");
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quote Number *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Q-001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select client" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clients?.data?.map((client: any) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date *</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        date={field.value ? new Date(field.value) : undefined}
                                        onDateChange={(date) => {
                                            field.onChange(date ? date.toISOString().split('T')[0] : '');
                                        }}
                                        placeholder="Select quote date"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="validUntil"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valid Until *</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        date={field.value ? new Date(field.value) : undefined}
                                        onDateChange={(date) => {
                                            field.onChange(date ? date.toISOString().split('T')[0] : '');
                                        }}
                                        placeholder="Select expiration date"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel>Items</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-start">
                            <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder="Description" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem className="w-24">
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="Qty"
                                                {...field}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                render={({ field }) => (
                                    <FormItem className="w-32">
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Price"
                                                {...field}
                                                onChange={e => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="mt-0.5"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}

                    <div className="flex justify-end pt-4 border-t">
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                        </div>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="SENT">Sent</SelectItem>
                                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                    <SelectItem value="EXPIRED">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Additional notes..."
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
                        {quote ? "Update Quote" : "Create Quote"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
