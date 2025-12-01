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

interface ClientPageProps {
    params: {
        id: string;
    };
}

// Mock data fetcher for now, replace with real API call
async function getClient(id: string) {
    // TODO: Implement API call
    return {
        id,
        nombre: "Cliente Demo",
        rfc: "XAXX010101000",
        email: "cliente@demo.com",
        isActive: true,
        _count: {
            projects: 5,
            invoices: 12,
        },
    };
}

export default async function ClientPage({ params }: ClientPageProps) {
    const client = await getClient(params.id);
    const t = await getTranslations("Clients");

    if (!client) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading title={client.nombre} description={client.rfc || ""} />
                <StatusChip status={client.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <MoneyFormatter amount={150000} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{client._count.projects}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="projects">Proyectos</TabsTrigger>
                    <TabsTrigger value="invoices">Facturas</TabsTrigger>
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
                                    <p>{client.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">RFC</p>
                                    <p>{client.rfc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="projects">
                    <Card>
                        <CardHeader>
                            <CardTitle>Proyectos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Lista de proyectos...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="invoices">
                    <Card>
                        <CardHeader>
                            <CardTitle>Facturas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Lista de facturas...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
