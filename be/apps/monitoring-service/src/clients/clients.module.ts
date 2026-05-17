import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthClientService } from './auth-client.service';
import { FarmClientService } from './farm-client.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuthClientService, FarmClientService],
  exports: [AuthClientService, FarmClientService],
})
export class ClientsModule {}
