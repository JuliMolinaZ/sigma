"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { DollarSign } from "lucide-react";

interface FinancialMetricsProps {
    total: number | string;
    paid: number | string;
    remaining: number | string;
    progress: number;
    title?: string;
}

export function FinancialMetrics({
    total,
    paid,
    remaining,
    progress,
    title = "Financials"
}: FinancialMetricsProps) {
    const totalNum = typeof total === 'string' ? parseFloat(total) : total;
    const paidNum = typeof paid === 'string' ? parseFloat(paid) : paid;
    const remainingNum = typeof remaining === 'string' ? parseFloat(remaining) : remaining;

    return (
        <Card className="border">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Payment Progress</span>
                        <span className="font-medium text-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Total
                        </div>
                        <div className="text-base font-semibold text-foreground">
                            {formatCurrency(totalNum)}
                        </div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                        <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Paid
                        </div>
                        <div className="text-base font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(paidNum)}
                        </div>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                        <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Remaining
                        </div>
                        <div className="text-base font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(remainingNum)}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

