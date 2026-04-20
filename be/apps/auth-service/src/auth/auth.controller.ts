import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthLoginDto,
  AuthLoginResponseDto,
  AuthVerifyResponseDto,
  UserProfileDto,
  UserProfileUpdateDto,
  Public,
  CurrentUser,
  JwtPayload,
} from '@trustagri/shared';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Xác thực zaloAccessToken, tạo/cập nhật user, phát hành JWT.
   * Response: { accessToken, refreshToken, userId, role, expiresAt }
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AuthLoginDto): Promise<AuthLoginResponseDto> {
    return this.authService.login(dto.zaloAccessToken);
  }

  /**
   * POST /api/v1/auth/verify
   * Xác thực JWT từ header Authorization, kiểm tra session Redis.
   * Response: { userId, role, valid: true }
   */
  @Post('verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  verify(
    @Headers('authorization') authorization: string,
  ): Promise<AuthVerifyResponseDto> {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu hoặc sai định dạng Authorization header');
    }
    const token = authorization.slice(7);
    return this.authService.verify(token);
  }

  /**
   * POST /api/v1/auth/logout
   * Xóa session khỏi Redis, vô hiệu hóa access token.
   * Response: { success: true }
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Headers('authorization') authorization: string,
  ): Promise<{ success: true }> {
    const token =
      authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    return this.authService.logout(token);
  }

  /**
   * GET /api/v1/auth/me
   * Trả về hồ sơ người dùng hiện tại theo role.
   * Response: UserProfileDto
   */
  @Get('me')
  getMe(@CurrentUser() user: JwtPayload): Promise<UserProfileDto> {
    return this.authService.getMe(user.sub);
  }

  /**
   * PUT /api/v1/auth/me
   * Cập nhật hồ sơ của chính người dùng đang đăng nhập.
   * Role-guard tự nhiên: chỉ chủ sở hữu token mới cập nhật được profile của mình.
   * Response: UserProfileDto
   */
  @Put('me')
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UserProfileUpdateDto,
  ): Promise<UserProfileDto> {
    return this.authService.updateMe(user.sub, dto);
  }
}
