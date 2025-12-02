'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";
import { DispatchModal } from "./DispatchModal";
import { useDispatchStats } from "@/hooks/useDispatches";

export function DispatchFAB() {
    const [open, setOpen] = useState(false);
    const { data: stats } = useDispatchStats();

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setOpen(true)}
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
                    title="New Dispatch (Ctrl+Shift+D)"
                >
                    <Radio className="h-6 w-6" />
                    {stats && stats.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                            {stats.unreadCount}
                        </span>
                    )}
                </Button>
            </div>
            <DispatchModal open={open} onOpenChange={setOpen} />
        </>
    );
}
