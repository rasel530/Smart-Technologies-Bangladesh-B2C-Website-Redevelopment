import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${email}`);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for email: ${email}`);
        return null;
      }

      // Remove password from returned user object
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error('Error during user validation', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;
      
      const user = await this.validateUser(email, password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      };
      
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      });

      // Update last login time
      await this.prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });

      this.logger.log(`User logged in successfully: ${email}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error('Login error', error);
      throw error;
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const { email, password, firstName, lastName, phone } = registerDto;

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Hash password
      const saltRounds = this.configService.get<number>('security.bcryptRounds') || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: UserRole.CUSTOMER,
        },
      });

      this.logger.log(`New user registered: ${email}`);

      // Remove password from returned user object
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error('Registration error', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      };
      
      const newAccessToken = this.jwtService.sign(payload);

      return { accessToken: newAccessToken };
    } catch (error) {
      this.logger.error('Token refresh error', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateJwtPayload(payload: any): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error('JWT payload validation error', error);
      return null;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      const saltRounds = this.configService.get<number>('security.bcryptRounds') || 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      this.logger.log(`Password changed for user: ${userId}`);
      return { message: 'Password changed successfully' };
    } catch (error) {
      this.logger.error('Password change error', error);
      throw error;
    }
  }
}