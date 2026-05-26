import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthClientService } from './auth-client.service';
import { ContractClientService } from './contract-client.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuthClientService, ContractClientService],
  exports: [AuthClientService, ContractClientService],
})
export class ClientsModule {}
