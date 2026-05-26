import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { CommonModule, validateConfig } from '@app/common';
import {
  User,
  Person,
  AppProfile,
  AppRole,
  Town,
  Country,
  AuditLog,
  SystemLog,
} from '@app/database';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { PersonService } from './person/person.service';
import { NotificationModule } from '@app/common/notification/notification.module';
import { SeedModule } from './seed/seed.module';
import { join } from 'path';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DatabaseModule,
    CommonModule,
    NotificationModule.forRootAsync({
      useFactory: () => ({
        templatesDir: join(
          process.cwd(),
          'libs/common/src/notification/templates',
        ),
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateConfig,
    }),
    TypeOrmModule.forFeature([
      User,
      Person,
      AppProfile,
      AppRole,
      Town,
      Country,
      AuditLog,
      SystemLog,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<number>('JWT_EXPIRE_AT') },
      }),
      inject: [ConfigService],
    }),
    SeedModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PersonService],
  exports: [AuthService, PersonService],
})
export class AuthServiceModule {}
