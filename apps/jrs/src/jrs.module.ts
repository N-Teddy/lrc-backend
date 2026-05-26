import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@app/database';
import {
  Person,
  User,
  AppProfile,
  AppRole,
  JrsMember,
  JrsActivity,
  JrsAttendance,
  Town,
  GradeLevel,
} from '@app/database';
import { CommonModule, validateConfig, AuthClientModule } from '@app/common';
import { NotificationModule } from '@app/common/notification/notification.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JrsMemberController } from './jrs-member/jrs-member.controller';
import { JrsMemberService } from './jrs-member/jrs-member.service';
import { JrsActivityController } from './jrs-activity/jrs-activity.controller';
import { JrsActivityService } from './jrs-activity/jrs-activity.service';
import { BirthdayService } from './birthday/birthday.service';
import { StatsController } from './stats/stats.controller';
import { StatsService } from './stats/stats.service';
import { PdfController } from './pdf/pdf.controller';
import { PdfService } from './pdf/pdf.service';
import { TacticalIntelligenceController } from './tactical-intelligence/tactical-intelligence.controller';
import { TacticalIntelligenceService } from './tactical-intelligence/tactical-intelligence.service';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateConfig,
    }),
    AuthClientModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Person,
      User,
      AppProfile,
      AppRole,
      JrsMember,
      JrsActivity,
      JrsAttendance,
      Town,
      GradeLevel,
    ]),
    CommonModule,
    NotificationModule.forRootAsync({
      useFactory: () => ({
        templatesDir: join(
          process.cwd(),
          'libs/common/src/notification/templates',
        ),
      }),
    }),
  ],
  controllers: [
    AuthController,
    JrsMemberController,
    JrsActivityController,
    StatsController,
    PdfController,
    TacticalIntelligenceController,
  ],
  providers: [
    AuthService,
    JrsMemberService,
    JrsActivityService,
    BirthdayService,
    StatsService,
    PdfService,
    TacticalIntelligenceService,
  ],
})
export class JrsModule {}
