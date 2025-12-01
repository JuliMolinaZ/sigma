import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

console.log('Middleware (SRC REBORN) loaded!');

export default createMiddleware(routing);

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
};

