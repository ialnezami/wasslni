import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthUser, UserRole } from '@wasslni/shared-types';
import { UsersRepository } from '../users/repositories/users.repository';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.Admin) throw new UnauthorizedException('Admin registration is not allowed');
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email is already registered');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepository.create({
      fullName: dto.fullName,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      passwordHash,
      role: dto.role,
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmailWithCredentials(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.isBanned) throw new UnauthorizedException('This account has been banned');
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.configService.get<string>('app.jwt.refreshSecret'),
      });
      const user = await this.usersRepository.findByIdWithCredentials(payload.sub);
      if (!user || !user.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.issueTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId?: string) {
    if (userId) await this.usersRepository.setRefreshTokenHash(userId, undefined);
    return { message: 'Logged out' };
  }

  private async issueTokens(user: { _id: unknown; role: UserRole; email: string; fullName: string }) {
    const authUser: AuthUser = { userId: String(user._id), role: user.role, email: user.email, fullName: user.fullName };
    const accessToken = await this.jwtService.signAsync({ sub: authUser.userId, role: authUser.role, email: authUser.email, fullName: authUser.fullName });
    const refreshToken = await this.jwtService.signAsync(
      { sub: authUser.userId },
      { secret: this.configService.get<string>('app.jwt.refreshSecret'), expiresIn: this.configService.get<string>('app.jwt.refreshExpiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}` },
    );
    await this.usersRepository.setRefreshTokenHash(authUser.userId, await bcrypt.hash(refreshToken, 12));
    return { accessToken, refreshToken, user: authUser };
  }
}
