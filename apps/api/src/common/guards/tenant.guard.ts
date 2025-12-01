import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TenantContext } from '../context/tenant.context';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        console.log(`[TenantGuard] User: ${JSON.stringify(user)}`);

        if (!user || !user.organizationId) {
            console.log(`[TenantGuard] User or OrganizationId missing`);
            throw new UnauthorizedException('Tenant context missing');
        }

        // Optional: Validate x-org-id/x-tenant-id header matches user.organizationId if strict header check is required
        const tenantHeader = (request.headers['x-org-id'] || request.headers['x-tenant-id']);
        if (tenantHeader && tenantHeader !== user.organizationId) {
            throw new UnauthorizedException('Tenant mismatch');
        }

        // Ensure CLS context is set (Double check)
        const ctxTenant = TenantContext.getTenantId();
        if (!ctxTenant || ctxTenant !== user.organizationId) {
            // If middleware didn't set it (e.g. public route becoming protected), set it now
            TenantContext.setTenantId(user.organizationId);
        }

        return true;
    }
}
