import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { CommonModule, validateConfig, AuthClientModule } from '@app/common';
import { NotificationModule } from '@app/common/notification/notification.module';
import { ActivityEligibilityService } from './activity/eligibility/activity-eligibility.service';
import { AppCode } from '@app/types';
import { Person } from '@app/database/entities/core/person.entity';
import { User } from '@app/database/entities/core/user.entity';
import { AppProfile } from '@app/database/entities/core/app-profile.entity';
import { AppRole } from '@app/database/entities/core/app-role.entity';
import { Town } from '@app/database/entities/core/town.entity';
import { Country } from '@app/database/entities/core/country.entity';
import { CentreActivity } from '@app/database/entities/centre/centre-activity.entity';
import { CentreAttendance } from '@app/database/entities/centre/centre-attendance.entity';
import { UploadModule } from '@app/common/upload/upload.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { PersonController } from './person/person.controller';
import { PersonService } from './person/person.service';
import { ActivityController } from './activity/activity.controller';
import { ActivityService } from './activity/activity.service';
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
    CommonModule,
    NotificationModule.forRootAsync({
      useFactory: () => ({
        templatesDir: join(
          process.cwd(),
          'libs/common/src/notification/templates',
        ),
      }),
    }),
    UploadModule.forApp(AppCode.CENTRE),
    TypeOrmModule.forFeature([
      Person,
      User,
      AppProfile,
      AppRole,
      Town,
      Country,
      CentreActivity,
      CentreAttendance,
    ]),
  ],
  controllers: [AuthController, PersonController, ActivityController],
  providers: [AuthService, PersonService, ActivityService, ActivityEligibilityService],
})
export class CentreModule {}