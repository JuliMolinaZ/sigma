'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import SigmaSidebar from '../navigation/SigmaSidebar'
import MobileSidebar from '../navigation/MobileSidebar'
import Navbar from '../navigation/Navbar'
import { useAuthStore } from '@/store/auth.store'
import Loader from '../ui/loader'

const queryClient = new QueryClient()

export interface EnterpriseLayoutProps {
    children: React.ReactNode
}

export default function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
    const router = useRouter()
    const { user, isLoading, restoreSession } = useAuthStore()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    useEffect(() => {
        restoreSession()
    }, [restoreSession])

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login')
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader size="lg" text="Loading..." />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                    <SigmaSidebar
                        isCollapsed={sidebarCollapsed}
                        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                </div>

                {/* Mobile Header & Sidebar */}
                <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-gray-900 border-b border-gray-800 flex items-center px-3 sm:px-4 justify-between shadow-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <MobileSidebar />
                        <span className="font-semibold text-base sm:text-lg text-white">Sigma</span>
                    </div>
                    {/* Mobile user menu - simplified */}
                    <div className="flex items-center gap-2">
                        <Navbar />
                    </div>
                </div>

                {/* Main Content */}
                <div 
                    className={cn(
                        "transition-all duration-300 pt-16 lg:pt-0",
                        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
                    )}
                >
                    {/* Desktop Navbar */}
                    <div className="hidden lg:block">
                        <Navbar />
                    </div>

                    {/* Page Content */}
                    <main className="p-3 sm:p-4 md:p-6 overflow-x-hidden">
                        <div className="max-w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </QueryClientProvider>
    )
}
