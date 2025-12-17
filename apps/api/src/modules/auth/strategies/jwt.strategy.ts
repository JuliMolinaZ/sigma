import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly authRepository: AuthRepository,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
        // Security: Don't log secret information in production
        if (process.env.NODE_ENV === 'development') {
            const secret = configService.get<string>('JWT_SECRET');
            console.log(`[JwtStrategy] Initialized with secret: ${secret ? 'YES (Length: ' + secret.length + ')' : 'NO'}`);
        }
    }

    async validate(payload: any) {
        // Security: Don't log sensitive payload data in production
        if (process.env.NODE_ENV === 'development') {
            console.log(`[JwtStrategy] Validating payload: ${JSON.stringify(payload)}`);
        }

        // 1. Check structural integrity of payload
        if (!payload.sub || !payload.email || !payload.orgId) {
            throw new UnauthorizedException('Invalid token payload: Missing critical fields');
        }

        // 2. Real User Lookup (Security Critical)
        const user = await this.authRepository.findUserById(payload.sub);
        if (!user) {
            // Security: Log without exposing user ID in production
            if (process.env.NODE_ENV === 'development') {
                console.log(`[JwtStrategy] User not found for sub: ${payload.sub}`);
            }
            throw new UnauthorizedException('User not found or access revoked');
        }

        // 3. Integrity Check: Ensure Token Org matches User Org
        // This prevents a user from using a valid token from Org A to access Org B if they were moved/removed.
        if (user.organizationId !== payload.orgId) {
            // Security: Log without exposing org IDs in production
            if (process.env.NODE_ENV === 'development') {
                console.log(`[JwtStrategy] Org mismatch. User: ${user.organizationId}, Token: ${payload.orgId}`);
            }
            throw new UnauthorizedException('Organization context mismatch');
        }

        // 4. Return full context for Request
        return {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
            role: user.role.name,
            organizationId: user.organizationId,
        };
    }
}
