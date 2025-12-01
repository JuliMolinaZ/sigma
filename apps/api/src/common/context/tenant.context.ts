import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class TenantContext {
    private static readonly storage = new AsyncLocalStorage<string>();

    static setTenantId(tenantId: string) {
        this.storage.enterWith(tenantId);
    }

    static getTenantId(): string | undefined {
        return this.storage.getStore();
    }
}
