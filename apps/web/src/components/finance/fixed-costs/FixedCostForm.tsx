"use client";

import * as React from "react";
import { useForm, Resolver } from "react-hook-form";
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
import { useCategories, FixedCost } from "@/hooks/useFinance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const fixedCostSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    categoryId: z.string().min(1, "Category is required"),
    amount: z.string().min(1, "Amount is required"),
    dayOfMonth: z.string().min(1, "Day is required"),
    isActive: z.boolean().default(true),
    description: z.string().optional(),
});

type FixedCostFormData = z.infer<typeof fixedCostSchema>;

interface FixedCostFormProps {
    fixedCost?: FixedCost;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function FixedCostForm({ fixedCost, onSuccess, onCancel }: FixedCostFormProps) {
    const queryClient = useQueryClient();
    const { data: categories } = useCategories();

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post("/finance/fixed-costs", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.put(`/finance/fixed-costs/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
        },
    });

    const form = useForm({
        resolver: zodResolver(fixedCostSchema),
        defaultValues: {
            title: fixedCost?.title || "",
            categoryId: fixedCost?.category?.id || fixedCost?.categoryId || "",
            amount: fixedCost?.amount?.toString() || "",
            dayOfMonth: fixedCost?.dayOfMonth?.toString() || "",
            isActive: fixedCost?.isActive ?? true,
            description: fixedCost?.description || "",
        },
    });

    const onSubmit = async (data: FixedCostFormData) => {
        try {
            const payload = {
                ...data,
                amount: parseFloat(data.amount),
                dayOfMonth: parseInt(data.dayOfMonth),
            };

            if (fixedCost?.id) {
                await updateMutation.mutateAsync({ id: fixedCost.id, data: payload });
                toast.success("Fixed cost updated successfully");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("Fixed cost created successfully");
            }
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save fixed cost");
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                                <Input placeholder="Rent, Internet, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories?.map((category: any) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                <div className="flex items-center gap-2">
                                                    {category.color && (
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: category.color }}
                                                        />
                                                    )}
                                                    {category.nombre}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                    <Input type="number" min="0" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="dayOfMonth"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Day of Month (1-31) *</FormLabel>
                                <FormControl>
                                    <Input type="number" min="1" max="31" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                    onValueChange={(value) => field.onChange(value === 'true')}
                                    value={field.value ? 'true' : 'false'}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
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
                        {fixedCost ? "Update Fixed Cost" : "Create Fixed Cost"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
