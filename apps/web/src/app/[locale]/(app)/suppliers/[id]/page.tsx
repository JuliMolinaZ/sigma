import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MoneyFormatter } from "@/components/shared/MoneyFormatter";
import { StatusChip } from "@/components/shared/StatusChip";

interface SupplierPageProps {
    params: {
        id: string;
    };
}

// Mock data fetcher
async function getSupplier(id: string) {
    return {
        id,
        nombre: "Proveedor Demo",
        rfc: "PXX010101000",
        email: "proveedor@demo.com",
        isActive: true,
        _count: {
            accountsPayable: 8,
            requisitions: 3,
        },
    };
}

export default async function SupplierPage({ params }: SupplierPageProps) {
    const supplier = await getSupplier(params.id);
    const t = await getTranslations("Suppliers");

    if (!supplier) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading title={supplier.nombre} description={supplier.rfc || ""} />
                <StatusChip status={supplier.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cuentas por Pagar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{supplier._count.accountsPayable}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Requisiciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{supplier._count.requisitions}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ap">Cuentas por Pagar</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p>{supplier.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">RFC</p>
                                    <p>{supplier.rfc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="ap">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cuentas por Pagar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Lista de cuentas por pagar...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Lista de documentos...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
