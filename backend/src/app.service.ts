import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Smart Technologies Bangladesh B2C API is running!';
  }

  getHealth(): object {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Smart Technologies B2C Backend',
      version: '1.0.0',
    };
  }
}