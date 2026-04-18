import { Body, Controller, Post } from '@nestjs/common';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  loginAdmin(@Body() body: AdminLoginDto) {
    return this.authService.loginAdmin(body);
  }
}
