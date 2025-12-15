import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    private readonly configService;
    constructor(configService: ConfigService);
    catch(exception: HttpException, host: ArgumentsHost): void;
}
