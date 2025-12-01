import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { MoneyFormatter } from "@/components/shared/MoneyFormatter";

interface DashboardKPIsProps {
    data: {
        finance: {
            totalAP: number;
            totalAR: number;
            fixedCostsMonthly: number;
        };
    };
}

export function DashboardKPIs({ data }: DashboardKPIsProps) {
    const finance = data?.finance || { totalAP: 0, totalAR: 0, fixedCostsMonthly: 0 };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <MoneyFormatter amount={finance.totalAR} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Pendientes de cobro
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cuentas por Pagar</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <MoneyFormatter amount={finance.totalAP} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Pendientes de pago
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos Fijos (Mes)</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <MoneyFormatter amount={finance.fixedCostsMonthly} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Recurrentes mensuales
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Flujo Neto Estimado</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <MoneyFormatter amount={finance.totalAR - finance.totalAP - finance.fixedCostsMonthly} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        AR - AP - Gastos Fijos
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
