import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        // Security: Don't log authorization headers in production (contain tokens)
        if (process.env.NODE_ENV === 'development') {
            const authHeader = request.headers['authorization'];
            console.log(`[JwtAuthGuard] Authorization Header: ${authHeader ? 'Present' : 'Missing'}`);
            console.log('[JwtAuthGuard] canActivate called');
        }

        const result = super.canActivate(context);
        if (process.env.NODE_ENV === 'development') {
            console.log('[JwtAuthGuard] canActivate result:', result);
        }
        return result;
    }

    handleRequest(err, user, info) {
        // Security: Don't log user info in production
        if (process.env.NODE_ENV === 'development') {
            console.log('[JwtAuthGuard] handleRequest - err:', err, 'user:', user ? 'present' : 'missing', 'info:', info);
        }
        if (err || !user) {
            throw err || new UnauthorizedException('Unauthorized');
        }
        return user;
    }
}
