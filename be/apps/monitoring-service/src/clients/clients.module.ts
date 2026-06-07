import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthClientService } from './auth-client.service';
import { FarmClientService } from './farm-client.service';
import { ContractClientService } from './contract-client.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuthClientService, FarmClientService, ContractClientService],
  exports: [AuthClientService, FarmClientService, ContractClientService],
})
export class ClientsModule {}
