import { Badge } from "@/components/ui/badge";

interface DispatchStatusBadgeProps {
    status: 'SENT' | 'READ' | 'IN_PROGRESS' | 'RESOLVED' | 'CONVERTED_TO_TASK';
}

export function DispatchStatusBadge({ status }: DispatchStatusBadgeProps) {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        SENT: { label: "Enviado", variant: "default" },
        READ: { label: "Leído", variant: "secondary" },
        IN_PROGRESS: { label: "En Proceso", variant: "outline" },
        RESOLVED: { label: "Resuelto", variant: "secondary" },
        CONVERTED_TO_TASK: { label: "Convertido a Tarea", variant: "outline" },
    };

    const config = variants[status] || variants.SENT;

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
