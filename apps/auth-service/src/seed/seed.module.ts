import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@app/common';
import { NotificationModule } from '@app/common/notification/notification.module';
import { SeedService } from './seed.service';
import { Country } from '@app/database';
import { Town } from '@app/database';
import { Person } from '@app/database';
import { User } from '@app/database';
import { AppProfile } from '@app/database';
import { AppRole } from '@app/database';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Country,
      Town,
      Person,
      User,
      AppProfile,
      AppRole,
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
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
