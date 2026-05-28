import { join } from 'path';
import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createLoggerConfig } from '@app/common/logger/winston.config';
import { AuditSubscriber } from './subscribers/audit.subscriber';
import { SystemLog } from './entities/log/system-log.entity';
import { AuditLog } from './entities/log/audit-log.entity';
import { Country } from './entities/core/country.entity';
import { Town } from './entities/core/town.entity';
import { Person } from './entities/core/person.entity';
import { User } from './entities/core/user.entity';
import { AppProfile } from './entities/core/app-profile.entity';
import { AppRole } from './entities/core/app-role.entity';
import { GradeCategory } from './entities/core/grade-category.entity';
import { GradeLevel } from './entities/core/grade-level.entity';
import { JeunesGroup } from './entities/jeunes/jeunes-group.entity';
import { JeunesMember } from './entities/jeunes/jeunes-member.entity';
import { ActivityEligibilityRule } from './entities/core/activity-eligibility-rule.entity';
import { Notification } from './entities/notification/notification.entity';
import { JrsMember } from './entities/jrs/jrs-member.entity';
import { JrsActivity } from './entities/jrs/jrs-activity.entity';
import { JrsAttendance } from './entities/jrs/jrs-attendance.entity';
import { CentreActivity } from './entities/centre/centre-activity.entity';
import { CentreAttendance } from './entities/centre/centre-attendance.entity';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>('DATABASE_NAME', 'lrc_db'),
        entities: [
          SystemLog,
          AuditLog,
          Country,
          Town,
          Person,
          User,
          AppProfile,
          AppRole,
          GradeCategory,
          GradeLevel,
          JeunesGroup,
          JeunesMember,
          ActivityEligibilityRule,
          Notification,
          JrsMember,
          JrsActivity,
          JrsAttendance,
          CentreActivity,
          CentreAttendance,
        ],
        autoLoadEntities: true,
        synchronize: false,
        migrations: [join(__dirname, 'migrations', '*.js')],
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      SystemLog,
      AuditLog,
      Country,
      Town,
      Person,
      User,
      AppProfile,
      AppRole,
      GradeCategory,
      GradeLevel,
      JeunesGroup,
      JeunesMember,
      ActivityEligibilityRule,
      Notification,
      JrsMember,
      JrsActivity,
      JrsAttendance,
      CentreActivity,
      CentreAttendance,
    ]),
  ],
  providers: [AuditSubscriber],
  exports: [TypeOrmModule],
})
export class DatabaseModule implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    Logger.overrideLogger(createLoggerConfig('Database', this.dataSource));
    Logger.log('DataTransport', 'DatabaseModule');
  }
}
