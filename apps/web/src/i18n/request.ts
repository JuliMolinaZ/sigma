import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    console.log('RequestConfig called. requestLocale:', locale);

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as any)) {
        console.log('Invalid or missing locale, falling back to default');
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
