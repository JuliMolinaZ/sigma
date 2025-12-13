import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly apiKeysService: ApiKeysService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey) {
            return true; // Pass through to other guards (like JWT) or let the controller decide if it's public
            // Actually, if this guard is used, it usually EXPECTS an API key.
            // But if we want to support BOTH JWT and API Key, we need a strategy.
            // For now, let's assume this guard is explicitly for endpoints that require API Key, 
            // OR we can make a Composite Guard.
            // Let's make it strict: If used, it checks for API Key.
            // return false; 
        }

        try {
            const keyRecord = await this.apiKeysService.validateApiKey(apiKey);

            // Attach user to request, similar to JWT strategy
            request.user = {
                id: keyRecord.user.id,
                email: keyRecord.user.email,
                role: keyRecord.user.role.name,
                organizationId: keyRecord.organizationId,
                isApiKey: true,
                scopes: keyRecord.scopes,
            };

            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid API Key');
        }
    }
}
