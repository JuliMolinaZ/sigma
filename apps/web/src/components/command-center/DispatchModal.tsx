'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDispatch } from "@/hooks/useDispatches";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface DispatchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface UserWithRole {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: {
        id?: string;
        name?: string;
    } | string;
    isActive?: boolean;
}

export function DispatchModal({ open, onOpenChange }: DispatchModalProps) {
    const [content, setContent] = useState("");
    const [recipientId, setRecipientId] = useState("");
    const [urgencyLevel, setUrgencyLevel] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

    const { data: usersData, isLoading: isLoadingUsers } = useUsers();
    const createDispatch = useCreateDispatch();

    // Get users array from different possible response structures
    const allUsers = Array.isArray(usersData)
        ? usersData
        : (usersData && typeof usersData === 'object' && 'data' in usersData && Array.isArray((usersData as { data: unknown }).data))
            ? (usersData as { data: UserWithRole[] }).data
            : [];

    // Filter for C-Suite executives only - matching backend guard
    const executives = allUsers.filter((user: UserWithRole) => {
        if (!user || !user.role) return false;

        const roleName = (typeof user.role === 'object' 
            ? (user.role?.name || '') 
            : (user.role || '')).toUpperCase().trim();

        // Match backend executive roles
        const executiveRoles = [
            'CEO',
            'CFO',
            'CTO',
            'COO',
            'CCO',
            'SUPERADMIN',
            'ADMINISTRATOR',
            'SUPER_ADMIN',
            'SUPERADMINISTRATOR',
            'GERENTE OPERACIONES',
            'OWNER', // Also include Owner role
        ];

        return executiveRoles.some(execRole =>
            roleName === execRole || (roleName && typeof roleName === 'string' && roleName.includes(execRole))
        );
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim() || !recipientId) {
            toast.error("Por favor completa todos los campos requeridos");
            return;
        }

        try {
            await createDispatch.mutateAsync({
                content: content.trim(),
                recipientId,
                urgencyLevel,
                dueDate: dueDate ? dueDate.toISOString() : undefined,
            });

            toast.success("El dispatch ha sido enviado exitosamente");

            // Reset form
            setContent("");
            setRecipientId("");
            setUrgencyLevel('NORMAL');
            setDueDate(undefined);
            onOpenChange(false);
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.response?.data?.message || "No se pudo enviar el dispatch");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>New Dispatch</DialogTitle>
                    <DialogDescription>
                        Send a quick message to another executive
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="content">Message *</Label>
                        <Textarea
                            id="content"
                            placeholder="Enter your message here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="resize-none"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient *</Label>
                        <Select value={recipientId} onValueChange={setRecipientId} disabled={isLoadingUsers}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingUsers ? "Loading executives..." : "Select an executive"} />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingUsers ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        Loading...
                                    </div>
                                ) : executives.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        No executives found. Please ensure users have executive roles (CEO, CFO, CTO, COO, CCO, Superadmin, etc.)
                                    </div>
                                ) : (
                                    executives.map((user: UserWithRole) => {
                                        const roleName = typeof user.role === 'object' ? user.role?.name : user.role || 'No role';
                                        return (
                                            <SelectItem key={user.id} value={user.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{user.firstName} {user.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({roleName})
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })
                                )}
                            </SelectContent>
                        </Select>
                        {!isLoadingUsers && executives.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No executives available. Users need roles like CEO, CFO, CTO, COO, CCO, or Superadmin.
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label>Urgency Level</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={urgencyLevel === 'NORMAL' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setUrgencyLevel('NORMAL')}
                            >
                                Normal
                            </Button>
                            <Button
                                type="button"
                                variant={urgencyLevel === 'URGENT' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setUrgencyLevel('URGENT')}
                                className={urgencyLevel === 'URGENT' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                            >
                                Urgente
                            </Button>
                            <Button
                                type="button"
                                variant={urgencyLevel === 'CRITICAL' ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => setUrgencyLevel('CRITICAL')}
                            >
                                Crítico
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Suggested Due Date (Optional)</Label>
                        <DatePicker
                            date={dueDate}
                            onDateChange={setDueDate}
                            placeholder="Pick a date"
                        />
                        <p className="text-xs text-muted-foreground">
                            Recipient can modify this date when converting to a task
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createDispatch.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createDispatch.isPending}>
                            {createDispatch.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Dispatch
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
