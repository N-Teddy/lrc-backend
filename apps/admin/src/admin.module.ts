import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { CommonModule, validateConfig, AuthClientModule } from '@app/common';
import { UploadModule } from '@app/common/upload/upload.module';
import { AppCode } from '@app/types';
import { Person } from '@app/database/entities/core/person.entity';
import { User } from '@app/database/entities/core/user.entity';
import { AppProfile } from '@app/database/entities/core/app-profile.entity';
import { AppRole } from '@app/database/entities/core/app-role.entity';
import { Town } from '@app/database/entities/core/town.entity';
import { Country } from '@app/database/entities/core/country.entity';
import { PersonService } from './services/person.service';
import { UserService } from './services/user.service';
import { ProfileService } from './services/profile.service';
import { TownService } from './services/town.service';
import { CountryService } from './services/country.service';
import { UsersController } from './controllers/users.controller';
import { PersonsController } from './controllers/persons.controller';
import { CountriesController } from './controllers/countries.controller';
import { TownsController } from './controllers/towns.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { RolesController } from './controllers/roles.controller';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

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
    UploadModule.forApp(AppCode.ADMIN),
    TypeOrmModule.forFeature([
      Person,
      User,
      AppProfile,
      AppRole,
      Town,
      Country,
    ]),
  ],
  controllers: [
    UsersController,
    PersonsController,
    CountriesController,
    TownsController,
    ProfilesController,
    RolesController,
    AuthController,
  ],
  providers: [
    PersonService,
    UserService,
    ProfileService,
    TownService,
    CountryService,
    AuthService,
  ],
})
export class AdminModule {}
