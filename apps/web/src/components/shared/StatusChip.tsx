import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusChipProps {
    status: string;
    className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
    const getVariant = (status: string) => {
        switch (status) {
            case "PAID":
            case "COMPLETED":
            case "ACTIVE":
            case "APPROVED":
                return "success";
            case "PENDING":
            case "IN_PROGRESS":
            case "REVIEW":
                return "warning";
            case "OVERDUE":
            case "REJECTED":
            case "CANCELLED":
                return "destructive";
            default:
                return "secondary";
        }
    };

    // Map variant to tailwind classes since Badge might not support all variants directly or we want custom colors
    const getColors = (variant: string) => {
        switch (variant) {
            case "success":
                return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300";
            case "warning":
                return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300";
            case "destructive":
                return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    return (
        <Badge variant="outline" className={cn(getColors(getVariant(status)), className)}>
            {status}
        </Badge>
    );
}
