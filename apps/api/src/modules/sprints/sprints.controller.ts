import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { QuerySprintDto } from './dto/query-sprint.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('sprints')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class SprintsController {
    constructor(private readonly sprintsService: SprintsService) {}

    @Post()
    @Permissions('sprints:create')
    create(@Request() req, @Body() createSprintDto: CreateSprintDto) {
        return this.sprintsService.create(req.user, createSprintDto);
    }

    @Get()
    @Permissions('sprints:read')
    findAll(@Request() req, @Query() query: QuerySprintDto) {
        return this.sprintsService.findAll(req.user, query);
    }

    @Get(':id')
    @Permissions('sprints:read')
    findOne(@Param('id') id: string, @Request() req) {
        return this.sprintsService.findOne(id, req.user);
    }

    @Get(':id/statistics')
    @Permissions('sprints:read')
    getStatistics(@Param('id') id: string, @Request() req) {
        return this.sprintsService.getStatistics(id, req.user);
    }

    @Get(':id/burndown')
    @Permissions('sprints:read')
    getBurndown(@Param('id') id: string, @Request() req) {
        return this.sprintsService.getBurndown(id, req.user);
    }

    @Get(':id/velocity')
    @Permissions('sprints:read')
    getVelocity(@Param('id') id: string, @Request() req) {
        return this.sprintsService.getVelocity(id, req.user);
    }

    @Patch(':id')
    @Permissions('sprints:update')
    update(@Param('id') id: string, @Request() req, @Body() updateSprintDto: UpdateSprintDto) {
        return this.sprintsService.update(id, req.user, updateSprintDto);
    }

    @Delete(':id')
    @Permissions('sprints:delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.sprintsService.remove(id, req.user);
    }
}
