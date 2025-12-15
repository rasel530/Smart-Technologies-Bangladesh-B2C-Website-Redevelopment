import { DynamicModule, Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {
  static forRoot(options: any = {}): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PrismaService,
          useFactory: (configService: ConfigService) => new PrismaService(configService),
          inject: [ConfigService],
        },
      ],
      exports: [PrismaService],
    };
  }
}