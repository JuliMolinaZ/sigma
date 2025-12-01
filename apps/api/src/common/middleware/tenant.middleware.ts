import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context/tenant.context';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(private readonly jwtService: JwtService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const tenantHeader = (req.headers['x-org-id'] || req.headers['x-tenant-id']) as string;
        const authHeader = req.headers.authorization;

        let tenantId = tenantHeader;

        // If no header, try to extract from JWT (if present)
        if (!tenantId && authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const payload = this.jwtService.decode(token) as any;
                if (payload && payload.orgId) {
                    tenantId = payload.orgId;
                }
            } catch (e) {
                // Ignore invalid token here, let Guard handle it
            }
        }

        if (tenantId) {
            TenantContext.setTenantId(tenantId);
        }

        next();
    }
}
