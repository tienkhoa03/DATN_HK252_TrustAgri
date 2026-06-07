import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthClientService } from './auth-client.service';
import { ProcessEventPublisherService } from './process-event-publisher.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuthClientService, ProcessEventPublisherService],
  exports: [AuthClientService, ProcessEventPublisherService],
})
export class ClientsModule {}
