'use client'

import { useState, useEffect, useMemo } from 'react'
import { Link, usePathname } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { MODULES, APP_NAME } from '@/lib/constants'
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useTranslations } from 'next-intl'
import { useEnabledModules } from '@/hooks/useOrganizationModules'
import Image from 'next/image'

export interface SigmaSidebarProps {
    isCollapsed?: boolean
    onToggle?: () => void
}

export default function SigmaSidebar({ isCollapsed = false, onToggle }: SigmaSidebarProps) {
    const pathname = usePathname()
    const { user } = useAuthStore()
    const [expandedSections, setExpandedSections] = useState<string[]>(['core', 'finance', 'admin', 'tools'])
    const t = useTranslations('navigation')
    const { data: enabledModules } = useEnabledModules()

    // Create a Set of enabled module IDs for quick lookup
    const enabledModuleIds = useMemo(() => {
        if (!enabledModules || !Array.isArray(enabledModules) || enabledModules.length === 0) {
            // If no modules configured, show all modules
            return null
        }
        // Only include modules that are enabled
        return new Set(
            enabledModules
                .filter((m) => m.isEnabled)
                .map((m) => m.moduleId)
        )
    }, [enabledModules])

    // Debugging log
    useEffect(() => {
        if (user) {
            const roleName = typeof user.role === 'object' ? (user.role as any).name : user.role;
            console.log('👤 User Role Debug:', {
                fullUser: user,
                detectedRole: roleName,
                roleType: typeof user.role
            });
        }
    }, [user]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        )
    }

    const canAccessModule = (module: typeof MODULES[0]) => {
        // Check if module is enabled in organization settings
        if (enabledModuleIds !== null && !enabledModuleIds.has(module.id)) {
            return false
        }

        // Check role-based access
        if (!module.requiredRole) return true
        if (!user) return false

        // Handle both string role and object role (from relation)
        const userRole = typeof user.role === 'object' ? (user.role as any).name : user.role

        return module.requiredRole.includes(userRole)
    }

    const modulesByCategory = {
        core: MODULES.filter(m => m.category === 'core' && canAccessModule(m)),
        finance: MODULES.filter(m => m.category === 'finance' && canAccessModule(m)),
        admin: MODULES.filter(m => m.category === 'admin' && canAccessModule(m)),
        tools: MODULES.filter(m => m.category === 'tools' && canAccessModule(m)),
    }

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-gray-900 text-gray-100 transition-all duration-300 border-r border-gray-800 flex flex-col',
                isCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 flex-shrink-0">
                {!isCollapsed && (
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="relative w-10 h-10 rounded-lg bg-white/95 backdrop-blur-sm p-1.5 transition-all duration-300 group-hover:bg-white group-hover:scale-105">
                            <Image
                                src="/sigma-black.jpeg"
                                alt="SIGMA"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xl tracking-tight">{APP_NAME.split(' ')[0]}</span>
                            <span className="text-xs text-gray-400">v3.0.3</span>
                        </div>
                    </Link>
                )}
                <button
                    onClick={onToggle}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
            </div>

            {/* Navigation - Scrollable */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1 sidebar-scrollbar">
                {Object.entries(modulesByCategory).map(([category, modules]) => {
                    if (modules.length === 0) return null

                    const isExpanded = expandedSections.includes(category)

                    return (
                        <div key={category} className="space-y-1">
                            {/* Category Header */}
                            {!isCollapsed && (
                                <button
                                    onClick={() => toggleSection(category)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
                                >
                                    <span>{t(`categories.${category}`)}</span>
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>
                            )}

                            {/* Module Links */}
                            {(isCollapsed || isExpanded) && modules.map((module) => {
                                const Icon = module.icon
                                const isActive = pathname === module.path || pathname.startsWith(module.path + '/')

                                return (
                                    <Link
                                        key={module.id}
                                        href={module.path}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all group',
                                            isActive
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                                            isCollapsed && 'justify-center'
                                        )}
                                        title={isCollapsed ? t(module.id) : undefined}
                                    >
                                        <Icon className={cn('flex-shrink-0', isCollapsed ? 'w-5 h-5' : 'w-5 h-5')} />
                                        {!isCollapsed && (
                                            <span className="text-sm font-medium truncate">{t(module.id)}</span>
                                        )}
                                        {!isCollapsed && isActive && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    )
                })}
            </nav>

            {/* Footer */}
            {!isCollapsed && user && (
                <div className="border-t border-gray-800 p-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                                {typeof user.role === 'object' ? (user.role as any).name : user.role}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    )
}
