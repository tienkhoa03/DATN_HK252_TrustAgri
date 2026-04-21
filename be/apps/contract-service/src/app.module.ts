import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TerminusModule } from '@nestjs/terminus';
import { SharedConfigModule, LoggerModule, databaseConfig, jwtConfig } from '@trustagri/shared';
import { HealthController } from './health/health.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConnectionsModule } from './connections/connections.module';
import { ProductsModule } from './products/products.module';
import { BuyingRequestsModule } from './buying-requests/buying-requests.module';
import { OrdersModule } from './orders/orders.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ContractsModule } from './contracts/contracts.module';
import { ContractChangeRequestsModule } from './contract-change-requests/contract-change-requests.module';

@Module({
  imports: [
    SharedConfigModule,
    LoggerModule,
    ConfigModule.forFeature(databaseConfig),
    ConfigModule.forFeature(jwtConfig),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get<string>('POSTGRES_USER', 'trustagri'),
        password: config.get<string>('POSTGRES_PASSWORD', 'trustagri_secret'),
        database: config.get<string>('POSTGRES_DB', 'trustagri'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change_me'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
      inject: [ConfigService],
    }),

    TerminusModule,
    ConnectionsModule,
    ProductsModule,
    BuyingRequestsModule,
    OrdersModule,
    ProposalsModule,
    ContractsModule,
    ContractChangeRequestsModule,
  ],
  controllers: [HealthController],
  providers: [JwtStrategy],
})
export class AppModule {}
