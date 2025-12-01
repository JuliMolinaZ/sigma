
import { MySQLConnection } from './prisma/migrations-runite/utils/mysql-connection';
import { MigrationLogger } from './prisma/migrations-runite/utils/logger';
import { migrationConfig } from './prisma/migrations-runite/config/migration.config';

async function main() {
    const logger = new MigrationLogger('describe-table');
    const mysql = new MySQLConnection(migrationConfig.mysql, logger);

    try {
        await mysql.connect();
        const columns = await mysql.query('DESCRIBE contabilidad');
        console.log('Columns in contabilidad:', columns);

        // Also fetch one row to see sample data
        const rows = await mysql.query('SELECT * FROM contabilidad LIMIT 1');
        console.log('Sample row:', rows[0]);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mysql.disconnect();
    }
}

main();
