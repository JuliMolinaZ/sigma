import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFormatter } from "@/components/shared/MoneyFormatter";
import { StatusChip } from "@/components/shared/StatusChip";

interface APPageProps {
    params: {
        id: string;
    };
}

// Mock data fetcher
async function getAP(id: string) {
    return {
        id,
        concepto: "Compra de Material",
        monto: 8500,
        pagado: false,
        fechaLimite: "2024-12-15",
        status: "PENDING",
        supplier: {
            nombre: "Proveedor Demo",
        },
        category: {
            nombre: "Materiales",
        },
    };
}

export default async function APPage({ params }: APPageProps) {
    const item = await getAP(params.id);
    const t = await getTranslations("Finance.AP");

    if (!item) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading title={item.concepto} description={item.supplier.nombre} />
                <StatusChip status={item.status} />
            </div>
            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <MoneyFormatter amount={item.monto} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">
                            {item.category.nombre}
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
                            <p className="text-sm font-medium text-muted-foreground">Fecha Límite</p>
                            <p>{item.fechaLimite}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Proveedor</p>
                            <p>{item.supplier.nombre}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
