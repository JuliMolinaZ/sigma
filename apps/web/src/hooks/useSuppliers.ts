import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Supplier {
    id: string;
    nombre: string;
    runProveedor: string | null;
    rfc: string | null;
    email: string | null;
    telefono: string | null;
    contacto: string | null;
    isActive: boolean;
    datosBancarios: string | null;
    _count?: {
        accountsPayable: number;
    };
}

export function useSuppliers(params?: { page?: number; limit?: number; search?: string }) {
    return useQuery({
        queryKey: ["suppliers", params],
        queryFn: async () => {
            const response = await api.get("/suppliers", { params });
            const body = response.data;

            // Case 1: Paginated response wrapped in success object
            if (body?.data?.data && Array.isArray(body.data.data)) {
                return {
                    data: body.data.data,
                    meta: body.data.meta
                };
            }

            // Case 2: Array wrapped in success object
            if (body?.data && Array.isArray(body.data)) {
                return { data: body.data, meta: null };
            }

            // Case 3: Direct Array
            if (Array.isArray(body)) {
                return { data: body, meta: null };
            }

            return { data: [], meta: null };
        },
    });
}

export function useSupplier(id: string) {
    return useQuery({
        queryKey: ["supplier", id],
        queryFn: async () => {
            const { data } = await api.get<any>(`/suppliers/${id}`);
            return data.data || data;
        },
        enabled: !!id,
    });
}

export function useSupplierStats(id: string) {
    return useQuery({
        queryKey: ["supplier-stats", id],
        queryFn: async () => {
            const { data } = await api.get(`/suppliers/${id}/statistics`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Supplier>) => {
            const response = await api.post("/suppliers", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        },
    });
}

export function useUpdateSupplier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Supplier> }) => {
            const response = await api.patch(`/suppliers/${id}`, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            queryClient.invalidateQueries({ queryKey: ["supplier", variables.id] });
        },
    });
}

export function useDeleteSupplier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/suppliers/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        },
    });
}
