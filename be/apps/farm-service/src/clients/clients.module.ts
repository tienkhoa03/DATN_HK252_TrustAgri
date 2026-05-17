import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthClientService } from './auth-client.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuthClientService],
  exports: [AuthClientService],
})
export class ClientsModule {}
