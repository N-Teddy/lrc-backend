import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLog } from '@app/database/entities/log/audit-log.entity';
import { SystemLog } from '@app/database/entities/log/system-log.entity';
import { HealthController } from './health/health.controller';
import { UserContextService } from './context/user-context.service';
import { AuditMiddleware } from './middlewares/audit.middleware';
import { GlobalConfigService } from './config/global-config.service';
import { AuditLogService } from './audit/audit-log.service';
import { SystemLogService } from './audit/system-log.service';
import { LogCleanupService } from './logger/log-cleanup.service';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PasswordService } from './security/password.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { LocationGuard } from './auth/guards/location.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { SocketAdminModule } from './socket-admin';

@Module({
  imports: [
    TerminusModule,
    ConfigModule,
    TypeOrmModule.forFeature([AuditLog, SystemLog]),
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET')!,
        signOptions: { expiresIn: configService.get<number>('JWT_EXPIRE_AT')! },
      }),
      inject: [ConfigService],
    }),
    SocketAdminModule,
  ],
  controllers: [HealthController],
  providers: [
    UserContextService,
    AuditMiddleware,
    GlobalConfigService,
    AuditLogService,
    SystemLogService,
    LogCleanupService,
    PasswordService,
    JwtAuthGuard,
    RolesGuard,
    LocationGuard,
    JwtStrategy,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [
    UserContextService,
    AuditMiddleware,
    GlobalConfigService,
    AuditLogService,
    SystemLogService,
    LogCleanupService,
    PasswordService,
    JwtAuthGuard,
    RolesGuard,
    LocationGuard,
    PassportModule,
    JwtModule,
    JwtStrategy,
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('*');
  }
}
