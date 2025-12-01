import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('dashboard')
    @Permissions('analytics:read')
    getDashboard(@Request() req) {
        return this.analyticsService.getDashboardOverview(req.user.organizationId);
    }

    @Get('projects/kpis')
    @Permissions('analytics:read')
    getProjectsKPIs(@Request() req) {
        return this.analyticsService.getProjectsKPIs(req.user.organizationId);
    }

    @Get('finance/kpis')
    @Permissions('analytics:read')
    getFinanceKPIs(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
        return this.analyticsService.getFinanceKPIs(req.user.organizationId, startDate, endDate);
    }

    @Get('tasks/metrics')
    @Permissions('analytics:read')
    getTasksMetrics(@Request() req) {
        return this.analyticsService.getTasksMetrics(req.user.organizationId);
    }

    @Get('users/activity')
    @Permissions('analytics:read')
    getUsersActivity(@Request() req) {
        return this.analyticsService.getUsersActivity(req.user.organizationId);
    }

    @Get('sprints/velocity')
    @Permissions('analytics:read')
    getSprintVelocity(@Request() req, @Query('projectId') projectId?: string) {
        return this.analyticsService.getSprintVelocity(req.user.organizationId, projectId);
    }
}
