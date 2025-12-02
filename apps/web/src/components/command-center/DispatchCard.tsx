'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Dispatch } from "@/hooks/useDispatches";
import { DispatchStatusBadge } from "./DispatchStatusBadge";

interface DispatchCardProps {
    dispatch: Dispatch;
    type: 'sent' | 'received';
    onClick: () => void;
}

export function DispatchCard({ dispatch, type, onClick }: DispatchCardProps) {
    const otherUser = type === 'sent' ? dispatch.recipient : dispatch.sender;
    const urgencyColors = {
        NORMAL: "text-gray-600 dark:text-gray-400",
        URGENT: "text-orange-600 dark:text-orange-400",
        CRITICAL: "text-red-600 dark:text-red-400",
    };

    const urgencyBgColors = {
        NORMAL: "bg-gray-50 dark:bg-gray-900",
        URGENT: "bg-orange-50 dark:bg-orange-950",
        CRITICAL: "bg-red-50 dark:bg-red-950",
    };

    const isUnread = type === 'received' && dispatch.status === 'SENT';

    return (
        <Card
            className={`cursor-pointer hover:shadow-md transition-all ${urgencyBgColors[dispatch.urgencyLevel]} ${isUnread ? 'border-l-4 border-l-blue-500' : ''}`}
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={otherUser.avatarUrl || undefined} />
                            <AvatarFallback>
                                {otherUser.firstName[0]}{otherUser.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                                {otherUser.firstName} {otherUser.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {otherUser.role.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <DispatchStatusBadge status={dispatch.status} />
                        {dispatch.urgencyLevel !== 'NORMAL' && (
                            <Badge variant="destructive" className="text-xs">
                                {dispatch.urgencyLevel === 'CRITICAL' ? (
                                    <>
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Crítico
                                    </>
                                ) : (
                                    <>
                                        <Clock className="w-3 h-3 mr-1" />
                                        Urgente
                                    </>
                                )}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm line-clamp-2 mb-3">
                    {dispatch.content}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(dispatch.createdAt), { addSuffix: true, locale: es })}
                    </span>
                    {dispatch.task && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Tarea creada
                        </span>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                        Ver detalles
                        <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
