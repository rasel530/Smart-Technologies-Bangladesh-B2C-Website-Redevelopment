import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
export declare const getLoggerConfig: (configService: ConfigService) => {
    level: string;
    format: winston.Logform.Format;
    transports: (winston.transports.ConsoleTransportInstance | winston.transports.FileTransportInstance)[];
    exitOnError: boolean;
};
