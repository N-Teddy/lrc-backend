import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@app/common';
import { NotificationModule } from '@app/common/notification/notification.module';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { DevSeedService } from './dev-seed.service';
import { Country } from '@app/database';
import { Town } from '@app/database';
import { Person } from '@app/database';
import { User } from '@app/database';
import { AppProfile } from '@app/database';
import { AppRole } from '@app/database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
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
  providers: [SeedService, DevSeedService],
})
class SeedRunnerModule {}

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(SeedRunnerModule);
    const devSeedService = app.get(DevSeedService);
    await devSeedService.runDevSeed();
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Error running dev seed:', error);
    process.exit(1);
  }
}

void bootstrap();
