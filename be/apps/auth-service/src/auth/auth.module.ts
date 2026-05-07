import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ZaloService } from './zalo.service';
import { RedisService } from './redis.service';
import { DevLoginEnabledGuard } from './guards/dev-login-enabled.guard';
import { DevLocalhostGuard } from './guards/dev-localhost.guard';
import { PasswordLoginEnabledGuard } from './guards/password-login-enabled.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [AuthController],
  providers: [
    AuthService,
    ZaloService,
    RedisService,
    DevLoginEnabledGuard,
    DevLocalhostGuard,
    PasswordLoginEnabledGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
