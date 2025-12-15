"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcrypt");
const client_1 = require("@prisma/client");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async validateUser(email, password) {
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
            const { password: _, ...result } = user;
            return result;
        }
        catch (error) {
            this.logger.error('Error during user validation', error);
            throw error;
        }
    }
    async login(loginDto) {
        try {
            const { email, password } = loginDto;
            const user = await this.validateUser(email, password);
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('Account is deactivated');
            }
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role
            };
            const accessToken = this.jwtService.sign(payload);
            const refreshToken = this.jwtService.sign(payload, {
                expiresIn: this.configService.get('jwt.refreshExpiresIn'),
            });
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
        }
        catch (error) {
            this.logger.error('Login error', error);
            throw error;
        }
    }
    async register(registerDto) {
        try {
            const { email, password, firstName, lastName, phone } = registerDto;
            const existingUser = await this.prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                throw new common_1.BadRequestException('User with this email already exists');
            }
            const saltRounds = this.configService.get('security.bcryptRounds') || 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    phone,
                    role: client_1.UserRole.CUSTOMER,
                },
            });
            this.logger.log(`New user registered: ${email}`);
            const { password: _, ...result } = user;
            return result;
        }
        catch (error) {
            this.logger.error('Registration error', error);
            throw error;
        }
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = this.jwtService.verify(refreshToken);
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.sub },
            });
            if (!user || !user.isActive) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role
            };
            const newAccessToken = this.jwtService.sign(payload);
            return { accessToken: newAccessToken };
        }
        catch (error) {
            this.logger.error('Token refresh error', error);
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async validateJwtPayload(payload) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || !user.isActive) {
                return null;
            }
            return user;
        }
        catch (error) {
            this.logger.error('JWT payload validation error', error);
            return null;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new common_1.UnauthorizedException('Current password is incorrect');
            }
            const saltRounds = this.configService.get('security.bcryptRounds') || 12;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
            await this.prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword },
            });
            this.logger.log(`Password changed for user: ${userId}`);
            return { message: 'Password changed successfully' };
        }
        catch (error) {
            this.logger.error('Password change error', error);
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map