import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  ParseUUIDPipe,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  AuthLoginDto,
  AuthDevLoginDto,
  AuthPasswordLoginDto,
  AuthLoginResponseDto,
  AuthVerifyResponseDto,
  AuthSwitchRoleDto,
  UserProfileDto,
  UserProfileUpdateDto,
  UserPublicSummaryDto,
  Public,
  CurrentUser,
  JwtPayload,
} from '@trustagri/shared';
import { AuthService } from './auth.service';
import { DevLoginEnabledGuard } from './guards/dev-login-enabled.guard';
import { DevLocalhostGuard } from './guards/dev-localhost.guard';
import { PasswordLoginEnabledGuard } from './guards/password-login-enabled.guard';
import { getClientIp } from './utils/client-ip';

@ApiTags('auth')
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
  @ApiOperation({ summary: 'Login with Zalo access token and issue JWT' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT tokens' })
  @ApiResponse({ status: 401, description: 'Invalid Zalo access token' })
  login(@Body() dto: AuthLoginDto): Promise<AuthLoginResponseDto> {
    return this.authService.login(dto.zaloAccessToken, dto.phoneNumber);
  }

  /**
   * POST /api/v1/auth/password-login
   * Đăng nhập bằng username/password. Chỉ hoạt động khi AUTH_PASSWORD_LOGIN_ENABLED=true.
   * User cần được seed trước với username + password_hash trong DB.
   */
  @Post('password-login')
  @Public()
  @UseGuards(PasswordLoginEnabledGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username/password (requires AUTH_PASSWORD_LOGIN_ENABLED=true)' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Password login is disabled' })
  passwordLogin(@Body() dto: AuthPasswordLoginDto): Promise<AuthLoginResponseDto> {
    return this.authService.passwordLogin(dto.username, dto.password);
  }

  /**
   * POST /api/v1/auth/dev-login
   * Chỉ dev: phát hành JWT thật (cùng secret Redis session như login Zalo).
   * Yêu cầu: AUTH_DEV_LOGIN_ENABLED=true, DEV_LOGIN_SECRET (≥16 ký tự), IP localhost
   * (hoặc DEV_LOGIN_ALLOW_IPS), rate limit theo IP (Redis).
   *
   * Body: { "secret": "<DEV_LOGIN_SECRET>", "zaloId": "zalo_dev_farmer_001" }
   */
  @Post('dev-login')
  @Public()
  @UseGuards(DevLoginEnabledGuard, DevLocalhostGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dev-only login using secret + zaloId (requires AUTH_DEV_LOGIN_ENABLED=true)' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT tokens' })
  @ApiResponse({ status: 403, description: 'Dev login disabled or wrong secret' })
  devLogin(@Body() dto: AuthDevLoginDto, @Req() req: Request): Promise<AuthLoginResponseDto> {
    const ip = getClientIp(req);
    return this.authService.devLogin(ip, dto.secret, dto.zaloId);
  }

  /**
   * POST /api/v1/auth/verify
   * Xác thực JWT từ header Authorization, kiểm tra session Redis.
   * Response: { userId, role, valid: true }
   */
  @Post('verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a JWT token and check Redis session validity' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid or expired' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate the current JWT session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: JwtPayload): Promise<UserProfileDto> {
    return this.authService.getMe(user.sub);
  }

  /**
   * GET /api/v1/auth/users/:userId
   * Tra cứu tên hiển thị (và avatar nếu có) theo UUID — không yêu cầu JWT.
   */
  @Get('users/:userId')
  @Public()
  @ApiOperation({ summary: 'Get public user summary by ID (no auth required)' })
  @ApiResponse({ status: 200, description: 'Public user summary returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<UserPublicSummaryDto> {
    return this.authService.getUserPublicById(userId);
  }

  /**
   * PUT /api/v1/auth/me
   * Cập nhật hồ sơ của chính người dùng đang đăng nhập.
   * Role-guard tự nhiên: chỉ chủ sở hữu token mới cập nhật được profile của mình.
   * Response: UserProfileDto
   */
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UserProfileUpdateDto,
  ): Promise<UserProfileDto> {
    return this.authService.updateMe(user.sub, dto);
  }

  /**
   * POST /api/v1/auth/switch-role
   * Phát hành JWT mới với active role được chỉ định. Role phải thuộc user.roles.
   */
  @Post('switch-role')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch active role and issue a new JWT' })
  @ApiResponse({ status: 200, description: 'New JWT issued for the selected role' })
  @ApiResponse({ status: 403, description: 'Role not in user.roles' })
  switchRole(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AuthSwitchRoleDto,
  ): Promise<AuthLoginResponseDto> {
    return this.authService.switchRole(user.sub, dto.role);
  }
}
