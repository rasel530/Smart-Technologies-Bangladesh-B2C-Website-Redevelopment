import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto, RefreshTokenDto, AuthResponseDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    register(registerDto: RegisterDto): Promise<any>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<any>;
    changePassword(user: any, changePasswordDto: ChangePasswordDto): Promise<any>;
    getProfile(user: any): Promise<any>;
}
