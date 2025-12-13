'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { useTransition } from 'react'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    const switchLanguage = (newLocale: string) => {
        startTransition(() => {
            // next-intl router handles the URL update and prefix automatically
            router.replace(pathname, { locale: newLocale })
        })
    }

    return (
        <div className="relative">
            <button
                onClick={() => switchLanguage(locale === 'en' ? 'es' : 'en')}
                disabled={isPending}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
                title={locale === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
            >
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
                    {locale}
                </span>
            </button>
        </div>
    )
}
