import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFormatter } from "@/components/shared/MoneyFormatter";
import { StatusChip } from "@/components/shared/StatusChip";

interface FixedCostPageProps {
    params: {
        id: string;
    };
}

// Mock data fetcher
async function getFixedCost(id: string) {
    return {
        id,
        nombre: "Renta de Oficina",
        categoria: "Infraestructura",
        monto: 25000,
        periodicidad: "Mensual",
        diaVencimiento: 5,
        isActive: true,
        ultimoPago: "2024-11-05",
        proximoPago: "2024-12-05",
    };
}

export default async function FixedCostPage({ params }: FixedCostPageProps) {
    const item = await getFixedCost(params.id);
    const t = await getTranslations("Finance.FixedCosts");

    if (!item) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading title={item.nombre} description={item.categoria} />
                <StatusChip status={item.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <MoneyFormatter amount={item.monto} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Periodicidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">
                            {item.periodicidad}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximo Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">
                            {item.proximoPago}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Día de Vencimiento</p>
                            <p>Día {item.diaVencimiento} de cada mes</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Último Pago</p>
                            <p>{item.ultimoPago}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
