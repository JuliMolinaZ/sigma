import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// Types
export interface AccountReceivable {
    id: string;
    concepto: string;
    monto: number;
    montoPagado: number;
    montoRestante: number;
    fechaVencimiento: string;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    client?: { nombre: string };
    project?: { name: string };
}

export interface AccountPayable {
    id: string;
    concepto: string;
    monto: number;
    montoPagado: number;
    montoRestante: number;
    fechaVencimiento: string;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    supplierId?: string;
    supplier?: { id: string; nombre: string };
    categoryId?: string;
    category?: { nombre: string; color?: string };
    notas?: string;
    autorizado?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Category {
    id: string;
    nombre: string;
    descripcion?: string;
    color?: string;
    organizationId: string;
}

export interface FixedCost {
    id: string;
    title: string;
    amount: number;
    dayOfMonth: number;
    categoryId?: string;
    category?: { id: string; nombre: string; color?: string };
    isActive: boolean;
    description?: string;
}

export interface Quote {
    id: string;
    number: string;
    clientId?: string;
    client?: { id: string; nombre: string };
    date: string;
    validUntil: string;
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
    amount: number;
    items?: Array<{ id: string; description: string; quantity: number; unitPrice: number; total: number }>;
    notes?: string;
}

export interface Invoice {
    id: string;
    number: string;
    amount: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    issueDate: string;
    dueDate: string;
    clientId?: string;
    client?: { id: string; nombre: string };
    items?: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    notes?: string;
}

export interface PaymentComplement {
    id: string;
    number: string;
    invoiceId: string;
    invoice?: { number: string; client?: { nombre: string } };
    date: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    notes?: string;
}

// Hooks


export function useAccountsReceivable(params?: { status?: string; search?: string }) {
    return useQuery({
        queryKey: ["accounts-receivable", params],
        queryFn: async () => {
            const response = await api.get("/finance/ar", { params });
            const body = response.data;
            if (body?.data?.data && Array.isArray(body.data.data)) return body.data.data;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        }
    });
}

export function useAccountReceivable(id: string) {
    return useQuery({
        queryKey: ["accounts-receivable", id],
        queryFn: async () => {
            const response = await api.get(`/finance/ar/${id}`);
            return response.data.data || response.data;
        },
        enabled: !!id,
    });
}

export function useCreateAccountReceivable() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post("/finance/ar", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
        },
    });
}

export function useUpdateAccountReceivable() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/finance/ar/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
        },
    });
}

export function useDeleteAccountReceivable() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/finance/ar/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
        },
    });
}

export function useAccountsPayable(params?: { status?: string; search?: string }) {
    return useQuery({
        queryKey: ["accounts-payable", params],
        queryFn: async () => {
            const response = await api.get("/finance/ap", { params });
            const body = response.data;
            if (body?.data?.data && Array.isArray(body.data.data)) return body.data.data;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        }
    });
}

export function useAccountPayable(id: string) {
    return useQuery({
        queryKey: ["accounts-payable", id],
        queryFn: async () => {
            const response = await api.get(`/finance/ap/${id}`);
            return response.data.data || response.data;
        },
        enabled: !!id,
    });
}

export function useCreateAccountPayable() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post("/finance/ap", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts-payable"] });
        },
    });
}

export function useUpdateAccountPayable() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/finance/ap/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts-payable"] });
        },
    });
}

export function useDeleteAccountPayable() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/finance/ap/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts-payable"] });
        },
    });
}

export function useFixedCosts(params?: { search?: string }) {
    return useQuery({
        queryKey: ["fixed-costs", params],
        queryFn: async () => {
            const response = await api.get("/finance/fixed-costs", { params });
            const body = response.data;
            if (body?.data?.data && Array.isArray(body.data.data)) return body.data.data;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        }
    });
}

export function useFixedCost(id: string) {
    return useQuery({
        queryKey: ["fixed-costs", id],
        queryFn: async () => {
            const response = await api.get(`/finance/fixed-costs/${id}`);
            return response.data.data || response.data;
        },
        enabled: !!id,
    });
}

export function useCreateFixedCost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post("/finance/fixed-costs", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
        },
    });
}

export function useUpdateFixedCost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/finance/fixed-costs/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
        },
    });
}

export function useDeleteFixedCost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/finance/fixed-costs/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
        },
    });
}

export function useInvoices(params?: { status?: string; search?: string }) {
    return useQuery({
        queryKey: ["invoices", params],
        queryFn: async () => {
            const response = await api.get("/finance/invoices", { params });
            const body = response.data;
            if (body?.data?.data && Array.isArray(body.data.data)) return body.data.data;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        }
    });
}

export function useQuotes(params?: { status?: string; search?: string }) {
    return useQuery({
        queryKey: ["quotes", params],
        queryFn: async () => {
            const response = await api.get("/finance/quotes", { params });
            const body = response.data;
            if (body?.data?.data && Array.isArray(body.data.data)) return body.data.data;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        },
    });
}

export function useQuote(id: string) {
    return useQuery({
        queryKey: ["quotes", id],
        queryFn: async () => {
            const response = await api.get(`/finance/quotes/${id}`);
            return response.data.data || response.data;
        },
        enabled: !!id,
    });
}

export function useCreateQuote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post("/finance/quotes", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
        },
    });
}

export function useUpdateQuote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/finance/quotes/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
        },
    });
}

export function useDeleteQuote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/finance/quotes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
        },
    });
}

export function usePaymentComplements(params?: { search?: string }) {
    return useQuery({
        queryKey: ["payment-complements", params],
        queryFn: async () => {
            const response = await api.get("/finance/payment-complements", { params });
            const body = response.data;
            if (body?.data?.data && Array.isArray(body.data.data)) return body.data.data;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        },
    });
}

export function usePaymentComplementsByAR(arId: string) {
    return useQuery({
        queryKey: ["payment-complements", "ar", arId],
        queryFn: async () => {
            const response = await api.get(`/finance/payment-complements/ar/${arId}`);
            const body = response.data;
            if (Array.isArray(body)) return body;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        },
        enabled: !!arId,
    });
}

export function usePaymentComplementsByAP(apId: string) {
    return useQuery({
        queryKey: ["payment-complements", "ap", apId],
        queryFn: async () => {
            const response = await api.get(`/finance/payment-complements/ap/${apId}`);
            const body = response.data;
            if (Array.isArray(body)) return body;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        },
        enabled: !!apId,
    });
}

export function useCreatePaymentComplement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post("/finance/payment-complements", data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["payment-complements"] });
            queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
            queryClient.invalidateQueries({ queryKey: ["accounts-receivable", variables.accountReceivableId] });
            queryClient.invalidateQueries({ queryKey: ["payment-complements", "ar", variables.accountReceivableId] });
        },
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await api.get("/finance/categories");
            const body = response.data;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        },
    });
}

export function usePurchaseOrders(params?: { status?: string; supplierId?: string; projectId?: string; search?: string }) {
    return useQuery({
        queryKey: ["purchase-orders", params],
        queryFn: async () => {
            // Filter out empty params
            const cleanParams = params ? Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '')
            ) : undefined;

            console.log('[usePurchaseOrders] Fetching with params:', cleanParams);
            const response = await api.get("/finance/purchase-orders", { params: cleanParams });
            const body = response.data;
            console.log('[usePurchaseOrders] Response structure:', {
                hasData: 'data' in body,
                hasMeta: 'meta' in body,
                dataType: typeof body.data,
                isArray: Array.isArray(body.data),
                dataLength: Array.isArray(body.data) ? body.data.length : 'N/A',
                fullResponse: body
            });
            if (body?.data?.data && Array.isArray(body.data.data)) {
                console.log('[usePurchaseOrders] Returning body.data.data (nested), length:', body.data.data.length);
                return body.data.data;
            }
            if (body?.data && Array.isArray(body.data)) {
                console.log('[usePurchaseOrders] Returning body.data, length:', body.data.length);
                return body.data;
            }
            console.log('[usePurchaseOrders] No data found, returning empty array');
            return [];
        },
    });
}

export function usePurchaseOrder(id: string) {
    return useQuery({
        queryKey: ["purchase-orders", id],
        queryFn: async () => {
            const response = await api.get(`/finance/purchase-orders/${id}`);
            return response.data.data || response.data;
        },
        enabled: !!id,
    });
}

export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post("/finance/purchase-orders", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        },
    });
}

export function useUpdatePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/finance/purchase-orders/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        },
    });
}

export function useDeletePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/finance/purchase-orders/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        },
    });
}

export function useSubmitPurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/finance/purchase-orders/${id}/submit`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        },
    });
}

export function useApprovePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/finance/purchase-orders/${id}/approve`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        },
    });
}

export function useRejectPurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/finance/purchase-orders/${id}/reject`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        },
    });
}

export function useMarkPurchaseOrderAsPaid() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/finance/purchase-orders/${id}/mark-paid`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        },
    });
}

export interface FlowRecovery {
    id: string;
    periodo: string;
    montoInicial: number;
    recuperacionesReales: number;
    porcentajeRecuperado: number;
    notas?: string;
    clientId: string;
    client?: { nombre: string };
    createdAt: string;
    updatedAt: string;
}

export function useFlowRecoveries() {
    return useQuery({
        queryKey: ["flow-recoveries"],
        queryFn: async () => {
            const response = await api.get("/finance/flow-recoveries");
            const body = response.data;
            if (body && Array.isArray(body)) return body;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        },
    });
}

export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    reference?: string;
    status: 'DRAFT' | 'POSTED' | 'VOID';
    items: Array<{
        id: string;
        accountId: string;
        account?: { name: string; code: string };
        debit: number;
        credit: number;
        description?: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export function useJournalEntries() {
    return useQuery({
        queryKey: ["journal-entries"],
        queryFn: async () => {
            const response = await api.get("/finance/journal-entries");
            const body = response.data;
            if (body && Array.isArray(body)) return body;
            if (body?.data && Array.isArray(body.data)) return body.data;
            return [];
        },
    });
}
