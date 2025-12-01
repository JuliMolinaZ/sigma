"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface CFDIViewerProps {
    data: any; // JSON data of the CFDI
    triggerLabel?: string;
}

export function CFDIViewer({ data, triggerLabel = "Ver CFDI" }: CFDIViewerProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Detalles del CFDI</DialogTitle>
                    <DialogDescription>
                        Visualización estructurada del comprobante fiscal.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-full w-full rounded-md border p-4 bg-muted/50">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
