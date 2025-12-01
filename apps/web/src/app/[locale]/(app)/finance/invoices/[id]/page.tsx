import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFormatter } from "@/components/shared/MoneyFormatter";
import { StatusChip } from "@/components/shared/StatusChip";
import { CFDIViewer } from "@/components/shared/CFDIViewer";

interface InvoicePageProps {
    params: {
        id: string;
    };
}

// Mock data fetcher
async function getInvoice(id: string) {
    return {
        id,
        number: "F-2024-001",
        client: {
            nombre: "Cliente Demo",
            rfc: "XAXX010101000",
        },
        total: 15000,
        subtotal: 12931.03,
        tax: 2068.97,
        issueDate: "2024-11-20",
        dueDate: "2024-12-20",
        status: "PAID",
        cfdiUuid: "12345678-1234-1234-1234-1234567890AB",
        documents: {
            xml: "<xml>...</xml>",
        },
    };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
    const item = await getInvoice(params.id);
    const t = await getTranslations("Finance.Invoices");

    if (!item) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading title={`Factura ${item.number}`} description={item.client.nombre} />
                <div className="flex items-center gap-2">
                    <StatusChip status={item.status} />
                    <CFDIViewer data={item.documents} />
                </div>
            </div>
            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <MoneyFormatter amount={item.total} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subtotal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">
                            <MoneyFormatter amount={item.subtotal} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">IVA</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">
                            <MoneyFormatter amount={item.tax} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fecha Emisión</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">
                            {item.issueDate}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles Fiscales</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">UUID</p>
                            <p className="font-mono text-sm">{item.cfdiUuid}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">RFC Receptor</p>
                            <p>{item.client.rfc}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
