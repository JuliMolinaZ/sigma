import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Expense } from "@/types";

// Hooks

export function useExpenses(params?: {
    status?: string;
    category?: string;
    projectId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}) {
    return useQuery({
        queryKey: ["expenses", params],
        queryFn: async () => {
            const response = await api.get("/expenses", { params });
            const body = response.data;
            if (body?.data?.data && Array.isArray(body.data.data)) return body.data.data;
            if (body?.data && Array.isArray(body.data)) return body.data;
            if (Array.isArray(body)) return body;
            return [];
        }
    });
}

export function useExpense(id: string) {
    return useQuery({
        queryKey: ["expense", id],
        queryFn: async () => {
            const response = await api.get(`/expenses/${id}`);
            const body = response.data;
            if (body?.data) return body.data;
            return body;
        },
        enabled: !!id
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Expense>) => {
            const response = await api.post("/expenses", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
        }
    });
}

export function useUpdateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Expense> }) => {
            const response = await api.patch(`/expenses/${id}`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expense", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
        }
    });
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/expenses/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
        }
    });
}

export function useExpenseStats(params?: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
}) {
    return useQuery({
        queryKey: ["expense-stats", params],
        queryFn: async () => {
            const response = await api.get("/expenses/stats", { params });
            const body = response.data;
            if (body?.data) return body.data;
            return body;
        }
    });
}
