import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false, // Disable default body parser to configure custom limits
    });

    // Increase body parser limit for image uploads (50MB)
    // Configure custom body parser with increased limits
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Security Headers
    app.use(helmet());

    // Global Prefix
    app.setGlobalPrefix('api');

    // CORS
    app.enableCors({
        origin: ['http://localhost:3001', 'http://127.0.0.1:3001', process.env.CORS_ORIGIN || '*'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        exposedHeaders: ['Authorization', 'x-org-id'],
    });

    // Global Validation
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));

    // Swagger Documentation
    const config = new DocumentBuilder()
        .setTitle('SIGMA ERP API')
        .setDescription(`
# SIGMA ERP - Enterprise Resource Planning System

A comprehensive, multi-tenant ERP system built with NestJS, featuring:

- **Project Management**: Projects, Tasks (Kanban), Sprints with Burndown
- **Finance**: Double-entry accounting, Accounts, Journal Entries, Financial Reports
- **Analytics**: Real-time KPIs, Dashboards, Metrics
- **Notifications**: Email & In-App notifications via BullMQ
- **Multi-Tenancy**: Organization-level data isolation
- **RBAC**: Role-Based Access Control with granular permissions

## Authentication

All endpoints (except auth) require a Bearer token. Obtain one via \`POST /auth/login\`.

## Multi-Tenancy

The \`X-Organization-Id\` header is required for all authenticated requests.
        `)
        .setVersion('1.0.0')
        .setContact('SIGMA Team', 'https://sigma-erp.com', 'support@sigma-erp.com')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter JWT token',
            },
            'JWT',
        )
        .addTag('Auth', 'Authentication and authorization endpoints')
        .addTag('Users', 'User management')
        .addTag('Roles', 'Role and permission management')
        .addTag('Projects', 'Project management')
        .addTag('Tasks', 'Task management with Kanban support')
        .addTag('Sprints', 'Sprint management with burndown charts')
        .addTag('Finance', 'Financial management and accounting')
        .addTag('Analytics', 'KPIs, metrics, and dashboards')
        .addTag('Health', 'System health checks')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'SIGMA ERP API Documentation',
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
        },
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);

    const logger = new Logger('Bootstrap');
    logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
    logger.log(`📚 API Documentation: ${await app.getUrl()}/api/docs`);
}
bootstrap();
