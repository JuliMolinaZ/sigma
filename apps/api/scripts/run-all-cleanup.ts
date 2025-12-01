import { execSync } from 'child_process';

console.log('\n🚀 EJECUTAR TODOS LOS SCRIPTS DE LIMPIEZA\n');
console.log('═'.repeat(60));

const scripts = [
    { name: '01-migrate-categories.ts', description: 'Migrar categorías' },
    { name: '02-populate-ar-clients.ts', description: 'Poblar clientes en CxC' },
    { name: '03-populate-invoice-clients.ts', description: 'Poblar clientes en facturas' },
    { name: '04-verify-payment-complements.ts', description: 'Verificar complementos de pago' },
];

let successCount = 0;
let failCount = 0;

for (const script of scripts) {
    console.log(`\n▶️  Ejecutando: ${script.description}...`);
    console.log('─'.repeat(60));

    try {
        execSync(`npx tsx scripts/${script.name}`, {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
        console.log(`✅ ${script.description} - COMPLETADO`);
        successCount++;
    } catch (error) {
        console.error(`❌ ${script.description} - FALLÓ`);
        failCount++;
    }
}

console.log('\n' + '═'.repeat(60));
console.log('\n📊 RESUMEN FINAL\n');
console.log(`✅ Scripts exitosos: ${successCount}`);
console.log(`❌ Scripts fallidos: ${failCount}`);
console.log(`📊 Total: ${scripts.length}`);

if (failCount === 0) {
    console.log('\n🎉 ¡Todos los scripts de limpieza completados exitosamente!\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Algunos scripts fallaron. Revisa los errores arriba.\n');
    process.exit(1);
}
