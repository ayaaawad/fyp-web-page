import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { CommonModule } from './common/common.module';
import { envValidationSchema } from './config/env.validation';
import { FirestoreModule } from './database/firestore.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    FirestoreModule,
    CommonModule,
    UsersModule,
    AuthModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
