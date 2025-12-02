'use client'

import { Dispatch, useDeleteDispatch } from "@/hooks/useDispatches";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, AlertCircle, ArrowRight, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CompactDispatchListProps {
    dispatches: Dispatch[];
    onDispatchClick: (dispatch: Dispatch) => void;
    currentUserId: string;
}

export function CompactDispatchList({ dispatches, onDispatchClick, currentUserId }: CompactDispatchListProps) {
    if (dispatches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>No active dispatches</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Header Row */}
            <div className="grid grid-cols-[32px_1fr_120px_100px_100px_80px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/40">
                <div className="text-center">#</div>
                <div>TASK / DISPATCH</div>
                <div>ASSIGNEE</div>
                <div>DUE DATE</div>
                <div>PRIORITY</div>
                <div></div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-border/40">
                {dispatches.map((dispatch) => (
                    <DispatchRow
                        key={dispatch.id}
                        dispatch={dispatch}
                        onClick={() => onDispatchClick(dispatch)}
                        currentUserId={currentUserId}
                    />
                ))}
            </div>
        </div>
    );
}

function DispatchRow({ dispatch, onClick, currentUserId }: { dispatch: Dispatch; onClick: () => void; currentUserId: string }) {
    const deleteDispatch = useDeleteDispatch();
    const isUrgent = dispatch.urgencyLevel === 'URGENT';
    const isCritical = dispatch.urgencyLevel === 'CRITICAL';
    const isSender = dispatch.senderId === currentUserId;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this dispatch?')) {
            deleteDispatch.mutate(dispatch.id);
        }
    };

    // Determine status icon
    const StatusIcon = dispatch.status === 'RESOLVED' || dispatch.status === 'CONVERTED_TO_TASK'
        ? CheckCircle2
        : dispatch.status === 'IN_PROGRESS'
            ? Clock
            : Circle;

    const statusColor = dispatch.status === 'RESOLVED' || dispatch.status === 'CONVERTED_TO_TASK'
        ? "text-green-500"
        : dispatch.status === 'IN_PROGRESS'
            ? "text-blue-500"
            : "text-gray-400";

    return (
        <div
            className="group grid grid-cols-[32px_1fr_120px_100px_100px_80px] gap-4 px-4 py-3 items-center hover:bg-muted/50 transition-colors cursor-pointer text-sm"
            onClick={onClick}
        >
            {/* Status Icon */}
            <div className="flex justify-center">
                <StatusIcon className={cn("h-4 w-4", statusColor)} />
            </div>

            {/* Content */}
            <div className="min-w-0 pr-4">
                <p className={cn(
                    "truncate font-medium text-foreground",
                    (dispatch.status === 'RESOLVED' || dispatch.status === 'CONVERTED_TO_TASK') && "line-through text-muted-foreground"
                )}>
                    {dispatch.content}
                </p>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6 border border-border">
                    <AvatarImage src={dispatch.recipient.avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px]">{dispatch.recipient.firstName[0]}</AvatarFallback>
                </Avatar>
                <span className="truncate text-xs text-muted-foreground">
                    {dispatch.recipient.firstName}
                </span>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {dispatch.dueDate ? (
                    <>
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(new Date(dispatch.dueDate), "MMM d")}</span>
                    </>
                ) : (
                    <span className="text-muted-foreground/50">-</span>
                )}
            </div>

            {/* Priority */}
            <div>
                {isCritical && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-medium rounded-sm uppercase tracking-wider">
                        Critical
                    </Badge>
                )}
                {isUrgent && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium rounded-sm uppercase tracking-wider bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
                        Urgent
                    </Badge>
                )}
                {!isUrgent && !isCritical && (
                    <span className="text-xs text-muted-foreground/50 px-1">Normal</span>
                )}
            </div>

            {/* Action */}
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isSender && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            </div>
        </div>
    );
}
