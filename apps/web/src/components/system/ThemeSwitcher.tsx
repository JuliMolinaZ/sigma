'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ThemeSwitcher() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        )
    }

    const currentTheme = theme === 'system' ? resolvedTheme : theme
    const isDark = currentTheme === 'dark'

    const handleClick = () => {
        const newTheme = isDark ? 'light' : 'dark'
        setTheme(newTheme)
    }

    return (
        <button
            onClick={handleClick}
            type="button"
            className={cn(
                "relative w-9 h-9 rounded-lg transition-all duration-300 cursor-pointer",
                "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
                "hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-800",
                "border border-gray-200 dark:border-gray-700",
                "shadow-sm hover:shadow-md",
                "flex items-center justify-center",
                "group"
            )}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
            <div className="relative w-5 h-5">
                <Sun 
                    className={cn(
                        "absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300",
                        isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                    )} 
                />
                <Moon 
                    className={cn(
                        "absolute inset-0 w-5 h-5 text-indigo-600 dark:text-indigo-400 transition-all duration-300",
                        isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                    )} 
                />
            </div>
        </button>
    )
}
