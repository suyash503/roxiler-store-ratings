import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { Env } from '../config/env';
import { PublicUser } from '../users/users.dto';
import { ACCESS_TOKEN_COOKIE, Public } from './auth.constants';
import type { AuthUser } from './auth.constants';
import { ChangePasswordDto, LoginDto, SignupDto } from './auth.dto';
import { AuthService, Session } from './auth.service';
import { CurrentUser } from './current-user.decorator';

/** Brute-force protection for the endpoints that take a password. */
const CREDENTIAL_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Register as a normal user and start a session. */
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    return this.startSession(res, await this.auth.signup(dto));
  }

  /** One login for every role. */
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    return this.startSession(res, await this.auth.login(dto));
  }

  /** Public so an expired session can still clear its cookie. */
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions());
  }

  @ApiCookieAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  /** Any role. Signs out other sessions and refreshes this one. */
  @ApiCookieAuth()
  @Throttle(CREDENTIAL_LIMIT)
  @Patch('password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    return this.startSession(res, await this.auth.changePassword(user.id, dto));
  }

  private startSession(res: Response, session: Session): PublicUser {
    res.cookie(ACCESS_TOKEN_COOKIE, session.token, {
      ...this.cookieOptions(),
      maxAge: this.auth.expiresIn(session.token) * 1000,
    });
    return session.user;
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      // Lax keeps the cookie off cross-site POSTs, which (with the CORS
      // allow-list) is the CSRF defence for this JSON API.
      sameSite: 'lax',
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      path: '/',
    };
  }
}
