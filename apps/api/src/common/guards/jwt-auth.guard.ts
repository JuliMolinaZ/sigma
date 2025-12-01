import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        console.log(`[JwtAuthGuard] Authorization Header: ${authHeader}`);

        console.log('[JwtAuthGuard] canActivate called');
        const result = super.canActivate(context);
        console.log('[JwtAuthGuard] canActivate result:', result);
        return result;
    }

    handleRequest(err, user, info) {
        console.log('[JwtAuthGuard] handleRequest - err:', err, 'user:', user, 'info:', info);
        if (err || !user) {
            throw err || new UnauthorizedException('Unauthorized');
        }
        return user;
    }
}
