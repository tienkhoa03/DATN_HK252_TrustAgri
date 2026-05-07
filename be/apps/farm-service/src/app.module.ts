import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TerminusModule } from '@nestjs/terminus';
import { SharedConfigModule, LoggerModule, databaseConfig, jwtConfig } from '@trustagri/shared';
import { HealthController } from './health/health.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FarmsModule } from './farms/farms.module';
import { StandardsModule } from './standards/standards.module';
import { CareLogsModule } from './care-logs/care-logs.module';
import { TraceabilityModule } from './traceability/traceability.module';
import { CarePlansModule } from './care-plans/care-plans.module';

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
        password: config.get<string>('POSTGRES_PASSWORD'),
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
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
      inject: [ConfigService],
    }),

    TerminusModule,
    FarmsModule,
    StandardsModule,
    CareLogsModule,
    TraceabilityModule,
    CarePlansModule,
  ],
  controllers: [HealthController],
  providers: [JwtStrategy],
})
export class AppModule {}
