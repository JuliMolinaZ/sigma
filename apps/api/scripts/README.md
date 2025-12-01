# 🧹 Scripts de Limpieza de Datos Financieros

Este directorio contiene scripts para limpiar y organizar los datos financieros migrados del sistema legacy SIGMA.

## 📋 Scripts Disponibles

### 1. `01-migrate-categories.ts`
**Propósito**: Migrar categorías desde el campo `notas` de cuentas por pagar a la tabla `categories`.

**Qué hace**:
- Extrae categorías únicas del campo `notas` (formato: "Categoria Legacy: nombre")
- Crea registros en la tabla `categories`
- Actualiza `categoryId` en `accounts_payable`
- Crea categorías estándar adicionales (Marketing, Tecnología, etc.)

**Ejecutar**:
```bash
cd apps/api
npx tsx scripts/01-migrate-categories.ts
```

**Resultado esperado**:
- ~8-13 categorías creadas por organización
- 240 cuentas por pagar categorizadas

---

### 2. `02-populate-ar-clients.ts`
**Propósito**: Poblar el campo `clientId` en cuentas por cobrar desde los proyectos asociados.

**Qué hace**:
- Obtiene todas las cuentas por cobrar sin `clientId`
- Extrae `clientId` del proyecto asociado
- Actualiza el campo `clientId` en `accounts_receivable`

**Ejecutar**:
```bash
cd apps/api
npx tsx scripts/02-populate-ar-clients.ts
```

**Resultado esperado**:
- 32 cuentas por cobrar con cliente asignado
- 100% de completitud en relaciones

---

### 3. `03-populate-invoice-clients.ts`
**Propósito**: Poblar el campo `clientId` en facturas buscando coincidencias por RFC y razón social.

**Qué hace**:
- Extrae RFC y razón social del campo `documents` (JSON)
- Busca coincidencias con clientes existentes
- Actualiza `clientId` en `invoices`
- Reporta facturas sin coincidencia para asignación manual

**Ejecutar**:
```bash
cd apps/api
npx tsx scripts/03-populate-invoice-clients.ts
```

**Resultado esperado**:
- 5 facturas procesadas
- Coincidencias encontradas y actualizadas

---

### 4. `04-verify-payment-complements.ts`
**Propósito**: Verificar que los complementos de pago coincidan con los montos pagados en cuentas por cobrar.

**Qué hace**:
- Calcula suma de complementos por cada cuenta por cobrar
- Compara con `montoPagado` actual
- Actualiza `montoPagado` y `montoRestante` si hay discrepancias
- Actualiza `status` según estado de pagos (PENDING, PARTIAL, PAID, OVERDUE)

**Ejecutar**:
```bash
cd apps/api
npx tsx scripts/04-verify-payment-complements.ts
```

**Resultado esperado**:
- 32 cuentas verificadas
- Montos corregidos
- Estados actualizados

---

### 5. `run-all-cleanup.ts`
**Propósito**: Ejecutar todos los scripts de limpieza en secuencia.

**Qué hace**:
- Ejecuta los 4 scripts anteriores en orden
- Muestra progreso y resultados
- Reporta éxitos y fallos

**Ejecutar**:
```bash
cd apps/api
npx tsx scripts/run-all-cleanup.ts
```

**Resultado esperado**:
- Todos los scripts completados exitosamente
- Datos limpios y organizados

---

## 🚀 Ejecución Recomendada

### Opción 1: Ejecutar todos los scripts (Recomendado)
```bash
cd apps/api
npx tsx scripts/run-all-cleanup.ts
```

### Opción 2: Ejecutar scripts individuales
```bash
cd apps/api
npx tsx scripts/01-migrate-categories.ts
npx tsx scripts/02-populate-ar-clients.ts
npx tsx scripts/03-populate-invoice-clients.ts
npx tsx scripts/04-verify-payment-complements.ts
```

---

## ⚠️ Precauciones

1. **Backup**: Estos scripts modifican datos. Asegúrate de tener un backup de la base de datos.
2. **Entorno**: Ejecuta primero en desarrollo/staging antes de producción.
3. **Verificación**: Después de ejecutar, verifica los datos en Prisma Studio.

---

## 📊 Verificación Post-Ejecución

Después de ejecutar los scripts, verifica los resultados:

```bash
# Ver datos en Prisma Studio
npx prisma studio

# Ejecutar script de verificación
npx tsx scripts/check-financial-data.ts
```

### Checklist de Verificación:
- [ ] Tabla `categories` tiene registros (esperado: ~8-13 por org)
- [ ] `accounts_payable.categoryId` poblado (esperado: ~240 registros)
- [ ] `accounts_receivable.clientId` poblado (esperado: 32 registros)
- [ ] `invoices.clientId` poblado (esperado: 5 registros)
- [ ] Montos en `accounts_receivable` correctos
- [ ] Estados en `accounts_receivable` actualizados

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@prisma/client'"
```bash
cd apps/api
npm install
npx prisma generate
```

### Error: "Database connection failed"
Verifica que el archivo `.env` tenga la variable `DATABASE_URL` correcta.

### Error: "Unique constraint violation"
Algunos scripts usan `upsert` para evitar duplicados. Si ves este error, verifica que no haya datos duplicados manualmente.

---

## 📝 Logs

Los scripts generan logs detallados en la consola:
- ✅ Operaciones exitosas
- ⚠️  Advertencias (datos que requieren atención manual)
- ❌ Errores

---

## 🔄 Re-ejecución

Los scripts están diseñados para ser **idempotentes** (se pueden ejecutar múltiples veces sin causar problemas):
- `01-migrate-categories.ts`: Usa `upsert`, no crea duplicados
- `02-populate-ar-clients.ts`: Solo actualiza registros con `clientId` null
- `03-populate-invoice-clients.ts`: Solo actualiza registros con `clientId` null
- `04-verify-payment-complements.ts`: Recalcula y actualiza siempre

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de error
2. Verifica la base de datos en Prisma Studio
3. Ejecuta scripts individuales para identificar el problema
4. Consulta el archivo `data_verification_report.md` para más detalles

---

**Última Actualización**: 2025-11-29  
**Versión**: 1.0.0
