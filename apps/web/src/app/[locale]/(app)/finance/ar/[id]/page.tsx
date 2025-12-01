import { notFound } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFormatter } from "@/components/shared/MoneyFormatter";
import { StatusChip } from "@/components/shared/StatusChip";

interface ARPageProps {
    params: Promise<{
        id: string;
    }>;
}

// Mock data fetcher
async function getAR(id: string) {
    return {
        id,
        concepto: "Factura F-001",
        monto: 15000,
        montoPagado: 5000,
        montoRestante: 10000,
        fechaVencimiento: "2024-12-31",
        status: "PENDING",
        client: {
            nombre: "Cliente Demo",
        },
    };
}

export default async function ARPage({ params }: ARPageProps) {
    const { id } = await params;
    const item = await getAR(id);

    if (!item) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading title={item.concepto} description={item.client.nombre} />
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
                        <CardTitle className="text-sm font-medium">Pagado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            <MoneyFormatter amount={item.montoPagado} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Restante</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            <MoneyFormatter amount={item.montoRestante} />
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
                            <p className="text-sm font-medium text-muted-foreground">Fecha Vencimiento</p>
                            <p>{item.fechaVencimiento}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                            <p>{item.client.nombre}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
