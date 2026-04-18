import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogsService } from './audit-logs.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAuditLogs(
    @Req() request: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ) {
    if (request.user.role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }

    const parsedLimit = limit ? Number(limit) : 50;
    return this.auditLogsService.getRecentLogs(parsedLimit);
  }
}
