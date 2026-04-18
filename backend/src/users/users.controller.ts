import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EnrollUserDto } from './dto/enroll-user.dto';
import { UpdateProcessControlsDto } from './dto/update-process-controls.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { UsersService } from './users.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post('enroll')
  async enroll(@Body() body: EnrollUserDto) {
    const user = await this.usersService.enrollCustomer(body);

    await this.auditLogsService.createLog({
      userId: user.userId,
      machineId: body.machineId ?? 'SIM-ENROLL-UI',
      transactionType: 'enrollment',
      success: true,
      metadata: {
        role: user.role,
      },
    });

    return {
      message: 'Enrollment successful',
      user,
    };
  }

  @Post('verify')
  async verify(@Body() body: VerifyUserDto) {
    const result = await this.usersService.verify1To1(
      body.userId,
      body.liveVector,
      body.transactionType,
    );

    await this.auditLogsService.createLog({
      userId: body.userId,
      machineId: body.machineId,
      transactionType: body.transactionType,
      success: result.isMatch,
      similarityScore: result.similarityScore,
      metadata: {
        complexity: 'O(1) via direct userId document lookup',
      },
    });

    return {
      ...result,
      verificationModel: '1:1',
      complexity: 'O(1)',
    };
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard)
  async listUsers(@Req() request: AuthenticatedRequest) {
    this.ensureAdminRole(request);
    return this.usersService.listUsers();
  }

  @Delete('admin/:userId')
  @UseGuards(JwtAuthGuard)
  async removeUser(
    @Req() request: AuthenticatedRequest,
    @Param('userId') userId: string,
  ) {
    this.ensureAdminRole(request);

    const result = await this.usersService.removeUserById(userId);
    await this.auditLogsService.createLog({
      userId: request.user.userId,
      machineId: 'ADMIN-CONTROL',
      transactionType: 'admin-remove-user',
      success: true,
      metadata: {
        removedUserId: userId,
      },
    });

    return result;
  }

  @Get('admin/processes')
  @UseGuards(JwtAuthGuard)
  async getProcessControls(@Req() request: AuthenticatedRequest) {
    this.ensureAdminRole(request);
    return this.usersService.getProcessControls();
  }

  @Put('admin/processes')
  @UseGuards(JwtAuthGuard)
  async updateProcessControls(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateProcessControlsDto,
  ) {
    this.ensureAdminRole(request);

    const controls = await this.usersService.updateProcessControls(
      body,
      request.user.userId,
    );

    await this.auditLogsService.createLog({
      userId: request.user.userId,
      machineId: 'ADMIN-CONTROL',
      transactionType: 'admin-process-update',
      success: true,
      metadata: {
        withdrawal: controls.withdrawal,
        transaction: controls.transaction,
        deposit: controls.deposit,
      },
    });

    return controls;
  }

  @Post('admin/enroll')
  @UseGuards(JwtAuthGuard)
  async adminEnroll(
    @Req() request: AuthenticatedRequest,
    @Body() body: EnrollUserDto,
  ) {
    this.ensureAdminRole(request);

    const user = await this.usersService.enrollCustomer(body);
    await this.auditLogsService.createLog({
      userId: request.user.userId,
      machineId: body.machineId ?? 'ADMIN-CONTROL',
      transactionType: 'admin-enrollment',
      success: true,
      metadata: {
        enrolledUserId: user.userId,
      },
    });

    return {
      message: 'Enrollment successful',
      user,
    };
  }

  private ensureAdminRole(request: AuthenticatedRequest): void {
    if (request.user.role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }
  }
}
