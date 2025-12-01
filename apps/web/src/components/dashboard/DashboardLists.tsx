import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardListsProps {
    topClients: any[];
    topSuppliers: any[];
}

export function DashboardLists({ topClients, topSuppliers }: DashboardListsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Top Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {topClients.map((client) => (
                            <div key={client.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{client.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {client.invoicesCount} facturas
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Proveedores Activos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {topSuppliers.map((supplier) => (
                            <div key={supplier.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>{supplier.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{supplier.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {supplier.apCount} cuentas por pagar
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
