import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../users/password.service';
import { PublicUser, publicUserSelect } from '../users/users.dto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.constants';
import { ChangePasswordDto, LoginDto, SignupDto } from './auth.dto';

export interface Session {
  user: PublicUser;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  /** Public sign-up always creates a normal user; other roles are added by an admin. */
  async signup(dto: SignupDto): Promise<Session> {
    const user = await this.users.create({ ...dto, role: Role.USER });
    return { user, token: await this.sign(user.id, 0) };
  }

  async login(dto: LoginDto): Promise<Session> {
    const found = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { ...publicUserSelect, passwordHash: true, tokenVersion: true },
    });
    // Always run bcrypt, and give one message for both cases, so the response
    // doesn't reveal which emails are registered.
    const valid = await this.passwords.verify(dto.password, found?.passwordHash);
    if (!found || !valid) throw new UnauthorizedException('Invalid email or password');

    const { passwordHash: _hash, tokenVersion, ...user } = found;
    return { user, token: await this.sign(user.id, tokenVersion) };
  }

  /** Changes the password and signs out every other session (tokenVersion bump). */
  async changePassword(userId: number, dto: ChangePasswordDto): Promise<Session> {
    const found = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!(await this.passwords.verify(dto.currentPassword, found.passwordHash))) {
      // 400, not 401: the session is fine, the form input is wrong.
      throw new BadRequestException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from the current one');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await this.passwords.hash(dto.newPassword),
        tokenVersion: { increment: 1 },
      },
      select: { ...publicUserSelect, tokenVersion: true },
    });
    const { tokenVersion, ...user } = updated;
    return { user, token: await this.sign(user.id, tokenVersion) };
  }

  /** Seconds until the token expires, for the cookie's Max-Age. */
  expiresIn(token: string): number {
    const { exp } = this.jwt.decode<{ exp: number }>(token);
    return Math.max(0, exp - Math.floor(Date.now() / 1000));
  }

  private sign(userId: number, tokenVersion: number): Promise<string> {
    const payload: JwtPayload = { sub: userId, tv: tokenVersion };
    return this.jwt.signAsync(payload);
  }
}
