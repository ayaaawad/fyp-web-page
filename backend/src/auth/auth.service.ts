import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from '../common/services/hashing.service';
import { UsersService } from '../users/users.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(payload: AdminLoginDto): Promise<{
    accessToken: string;
    admin: {
      userId: string;
      email: string;
      role: 'admin' | 'customer';
    };
  }> {
    const adminUser = await this.usersService.getAdminByEmail(payload.email);

    if (
      !adminUser ||
      !adminUser.passwordHash ||
      !adminUser.passwordSalt ||
      !adminUser.passwordIterations ||
      !adminUser.passwordKeylen ||
      !adminUser.passwordDigest
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = this.hashingService.verifySecret(payload.password, {
      hash: adminUser.passwordHash,
      salt: adminUser.passwordSalt,
      iterations: adminUser.passwordIterations,
      keylen: adminUser.passwordKeylen,
      digest: adminUser.passwordDigest,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: adminUser.userId,
      email: adminUser.email,
      role: adminUser.role,
    });

    return {
      accessToken,
      admin: {
        userId: adminUser.userId,
        email: adminUser.email,
        role: adminUser.role,
      },
    };
  }
}
