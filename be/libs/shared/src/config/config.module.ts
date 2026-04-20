import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

/**
 * Shared config module — import vào mọi service
 * Tải .env từ thư mục gốc workspace
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      cache: true,
    }),
  ],
  exports: [NestConfigModule],
})
export class SharedConfigModule {}
