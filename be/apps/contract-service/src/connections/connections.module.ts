import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ConnectionEntity } from './entities/connection.entity';
import { ConnectionsService } from './connections.service';
import { ConnectionsController, SearchController } from './connections.controller';
import { ConnectionPublisherService } from './services/connection-publisher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConnectionEntity]),
    ConfigModule,
  ],
  controllers: [SearchController, ConnectionsController],
  providers: [ConnectionsService, ConnectionPublisherService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
