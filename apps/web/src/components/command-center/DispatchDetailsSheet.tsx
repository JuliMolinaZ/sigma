'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useDispatch, useMarkAsRead, useMarkInProgress, useResolveDispatch, useDeleteDispatch } from "@/hooks/useDispatches";
import { toast } from "sonner";
import { DispatchStatusBadge } from "./DispatchStatusBadge";
import { Loader2, Eye, PlayCircle, CheckCircle2, FileText, Clock, AlertCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";

interface DispatchDetailsSheetProps {
    dispatchId: string | null;
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

interface UserRole {
    name?: string;
}

export function DispatchDetailsSheet({ dispatchId, open, onOpenChange }: DispatchDetailsSheetProps) {
    const [resolutionNote, setResolutionNote] = useState("");
    const { data: dispatch, isLoading } = useDispatch(dispatchId || '');
    const markAsRead = useMarkAsRead();
    const markInProgress = useMarkInProgress();
    const resolveDispatch = useResolveDispatch();
    const deleteDispatch = useDeleteDispatch();
    const { user } = useAuthStore();

    const handleMarkAsRead = async () => {
        if (!dispatchId) return;
        try {
            await markAsRead.mutateAsync(dispatchId);
            toast.success("Marcado como leído");
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.response?.data?.message || "No se pudo marcar como leído");
        }
    };

    const handleMarkInProgress = async () => {
        if (!dispatchId) return;
        try {
            await markInProgress.mutateAsync(dispatchId);
            toast.success("Marcado en proceso");
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.response?.data?.message || "No se pudo actualizar el estado");
        }
    };

    const handleResolve = async () => {
        if (!dispatchId) return;
        try {
            await resolveDispatch.mutateAsync({ id: dispatchId, resolutionNote });
            toast.success("Dispatch resuelto exitosamente");
            setResolutionNote("");
            onOpenChange(false);
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.response?.data?.message || "No se pudo resolver el dispatch");
        }
    };




    const handleDelete = async () => {
        if (!dispatchId) return;
        if (!confirm('¿Estás seguro de que quieres eliminar este dispatch? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await deleteDispatch.mutateAsync(dispatchId);
            toast.success("Dispatch eliminado exitosamente");
            onOpenChange(false);
            // Refresh page to update list
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.response?.data?.message || "No se pudo eliminar el dispatch");
        }
    };

    // Check if user is Super Admin (moved before useEffect)
    const userRole = user?.role;
    const roleName = typeof userRole === 'string'
        ? userRole
        : (typeof userRole === 'object' && userRole !== null && 'name' in userRole
            ? (userRole as UserRole).name
            : '') || '';
    const isSuperAdmin = roleName ? ['SUPERADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR'].includes(roleName.toUpperCase()) : false;
    const isRecipient = user?.id === dispatch?.recipientId;



    if (!dispatchId) return null;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {isLoading ? 'Cargando...' : dispatch ? 'Detalles del Dispatch' : 'Dispatch'}
                        </SheetTitle>
                        {dispatch && (
                            <SheetDescription>
                                {formatDistanceToNow(new Date(dispatch.createdAt), { addSuffix: true, locale: es })}
                            </SheetDescription>
                        )}
                    </SheetHeader>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-full mt-6">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : dispatch ? (
                        <>

                            <div className="mt-6 space-y-6">
                                {/* Sender/Recipient Info */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={dispatch.sender.avatarUrl || undefined} />
                                            <AvatarFallback>
                                                {dispatch.sender.firstName[0]}{dispatch.sender.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">De: {dispatch.sender.firstName} {dispatch.sender.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{dispatch.sender.role.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={dispatch.recipient.avatarUrl || undefined} />
                                            <AvatarFallback>
                                                {dispatch.recipient.firstName[0]}{dispatch.recipient.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">Para: {dispatch.recipient.firstName} {dispatch.recipient.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{dispatch.recipient.role.name}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Status and Urgency */}
                                <div className="flex items-center gap-2">
                                    <DispatchStatusBadge status={dispatch.status} />
                                    {dispatch.urgencyLevel !== 'NORMAL' && (
                                        <span className={`text-sm font-medium ${dispatch.urgencyLevel === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'
                                            }`}>
                                            {dispatch.urgencyLevel === 'CRITICAL' ? (
                                                <>
                                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                                    Crítico
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-4 h-4 inline mr-1" />
                                                    Urgente
                                                </>
                                            )}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <Label>Mensaje</Label>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="text-sm whitespace-pre-wrap">{dispatch.content}</p>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-2">
                                    <Label>Historial</Label>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            Enviado: {new Date(dispatch.createdAt).toLocaleString('es-MX')}
                                        </div>
                                        {dispatch.readAt && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                Leído: {new Date(dispatch.readAt).toLocaleString('es-MX')}
                                            </div>
                                        )}
                                        {dispatch.inProgressAt && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                En proceso: {new Date(dispatch.inProgressAt).toLocaleString('es-MX')}
                                            </div>
                                        )}
                                        {dispatch.resolvedAt && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                                Resuelto: {new Date(dispatch.resolvedAt).toLocaleString('es-MX')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Resolution Note */}
                                {dispatch.resolutionNote && (
                                    <div className="space-y-2">
                                        <Label>Nota de Resolución</Label>
                                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                                            <p className="text-sm">{dispatch.resolutionNote}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Linked Task */}
                                {dispatch.task && (
                                    <div className="space-y-2">
                                        <Label>Tarea Vinculada</Label>
                                        <Link href={`/tasks?id=${dispatch.task.id}`}>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                    <p className="text-sm font-medium">{dispatch.task.title}</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Estado: {dispatch.task.status}
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                )}

                                <Separator />

                                {/* Actions */}
                                {dispatch.status !== 'RESOLVED' && dispatch.status !== 'CONVERTED_TO_TASK' && (
                                    <div className="space-y-4">
                                        <Label>Acciones</Label>
                                        <div className="space-y-2">
                                            {isRecipient && dispatch.status === 'SENT' && (
                                                <Button
                                                    onClick={handleMarkAsRead}
                                                    variant="outline"
                                                    className="w-full"
                                                    disabled={markAsRead.isPending}
                                                >
                                                    {markAsRead.isPending ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Eye className="w-4 h-4 mr-2" />
                                                    )}
                                                    Marcar como Leído
                                                </Button>
                                            )}
                                            {isRecipient && (dispatch.status === 'SENT' || dispatch.status === 'READ') && (
                                                <Button
                                                    onClick={handleMarkInProgress}
                                                    variant="outline"
                                                    className="w-full"
                                                    disabled={markInProgress.isPending}
                                                >
                                                    {markInProgress.isPending ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <PlayCircle className="w-4 h-4 mr-2" />
                                                    )}
                                                    Marcar En Proceso
                                                </Button>
                                            )}
                                            {isRecipient && (
                                                <div className="space-y-2">
                                                    <Textarea
                                                        placeholder="Nota de resolución (opcional)"
                                                        value={resolutionNote}
                                                        onChange={(e) => setResolutionNote(e.target.value)}
                                                        rows={3}
                                                    />
                                                    <Button
                                                        onClick={handleResolve}
                                                        className="w-full"
                                                        disabled={resolveDispatch.isPending}
                                                    >
                                                        {resolveDispatch.isPending ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        )}
                                                        Resolver
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Super Admin Delete Button */}
                                {isSuperAdmin && (
                                    <div className="mt-4">
                                        <Separator className="mb-4" />
                                        <div className="space-y-2">
                                            <Label className="text-red-600">Super Admin Actions</Label>
                                            <Button
                                                onClick={handleDelete}
                                                variant="destructive"
                                                className="w-full"
                                                disabled={deleteDispatch.isPending}
                                            >
                                                {deleteDispatch.isPending ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                )}
                                                Eliminar Dispatch
                                            </Button>
                                            <p className="text-xs text-muted-foreground">
                                                Como Super Admin, puedes eliminar cualquier dispatch sin importar su estado.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full mt-6">
                            <p className="text-muted-foreground">Dispatch no encontrado</p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
