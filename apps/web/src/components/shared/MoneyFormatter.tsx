import { cn } from "@/lib/utils";

interface MoneyFormatterProps {
    amount: number;
    currency?: string;
    className?: string;
}

export function MoneyFormatter({ amount, currency = "MXN", className }: MoneyFormatterProps) {
    const formatted = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: currency,
    }).format(amount);

    return <span className={cn("font-mono", className)}>{formatted}</span>;
}
