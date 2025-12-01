
import { MySQLConnection } from './prisma/migrations-runite/utils/mysql-connection';
import { MigrationLogger } from './prisma/migrations-runite/utils/logger';
import { migrationConfig } from './prisma/migrations-runite/config/migration.config';

async function main() {
    const logger = new MigrationLogger('list-tables');
    const mysql = new MySQLConnection(migrationConfig.mysql, logger);

    try {
        await mysql.connect();
        const tables = await mysql.query('SHOW TABLES');
        console.log('Tables in database:', tables);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mysql.disconnect();
    }
}

main();
