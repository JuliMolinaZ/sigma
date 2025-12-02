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
import { useCreateExpense, useUpdateExpense } from "@/hooks/useExpenses";
import { Expense } from "@/types";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { useProjects } from "@/hooks/useProjects";
import { DatePicker } from "@/components/ui/date-picker";

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

const CURRENCIES = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "MXN", label: "MXN - Mexican Peso" },
    { value: "EUR", label: "EUR - Euro" },
];

const expenseSchema = z.object({
    description: z.string().min(3, "Description must be at least 3 characters"),
    category: z.string().min(1, "Category is required"),
    amount: z.string().min(1, "Amount is required"),
    currency: z.string().default("USD"),
    date: z.string().min(1, "Date is required"),
    projectId: z.string().optional(),
    receiptUrl: z.string().optional(),
    status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "REIMBURSED"]).default("DRAFT"),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
    expense?: Expense;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {

    const createExpense = useCreateExpense();
    const updateExpense = useUpdateExpense();
    const { data: projects } = useProjects();

    const form = useForm({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            description: expense?.description || "",
            category: expense?.category || "",
            amount: expense?.amount?.toString() || "",
            currency: expense?.currency || "USD",
            date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            projectId: expense?.projectId || "",
            receiptUrl: expense?.receiptUrl || "",
            status: expense?.status || "DRAFT",
        },
    });

    const onSubmit = async (data: ExpenseFormData) => {
        try {
            const payload = {
                ...data,
                amount: parseFloat(data.amount),
                date: new Date(data.date).toISOString(),
                projectId: data.projectId || undefined,
            };

            if (expense?.id) {
                await updateExpense.mutateAsync({ id: expense.id, data: payload });
                toast.success("Expense updated successfully");
            } else {
                await createExpense.mutateAsync(payload);
                toast.success("Expense created successfully");
            }

            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save expense");
        }
    };

    const isLoading = createExpense.isPending || updateExpense.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter expense description..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="category"
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
                                        {EXPENSE_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
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
                                        placeholder="Select expense date"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Currency *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {CURRENCIES.map((curr) => (
                                            <SelectItem key={curr.value} value={curr.value}>
                                                {curr.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Array.isArray(projects) && projects.map((project: any) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name}
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
                    name="receiptUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Receipt URL (Optional)</FormLabel>
                            <FormControl>
                                <Input
                                    type="url"
                                    placeholder="https://..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                    <SelectItem value="REIMBURSED">Reimbursed</SelectItem>
                                </SelectContent>
                            </Select>
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
                        {expense ? "Update Expense" : "Create Expense"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
