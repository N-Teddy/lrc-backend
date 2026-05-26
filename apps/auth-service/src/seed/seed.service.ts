import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoreSeedData } from './data/core-seed.data';
import { Country } from '@app/database';
import { Town } from '@app/database';
import { Person } from '@app/database';
import { User } from '@app/database';
import { AppProfile } from '@app/database';
import { AppRole } from '@app/database';
import { AppCode } from '@app/types';
import { AppRole as AppRoleEnum } from '@app/types';
import { PasswordService } from '@app/common';
import { NotificationService } from '@app/common';
import * as crypto from 'crypto';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(Town) private readonly townRepo: Repository<Town>,
    @InjectRepository(Person) private readonly personRepo: Repository<Person>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AppProfile)
    private readonly appProfileRepo: Repository<AppProfile>,
    @InjectRepository(AppRole)
    private readonly appRoleRepo: Repository<AppRole>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    if (this.configService.get<boolean>('SEED_DB')) {
      await this.seed();
    }
  }

  async seed() {
    await this.seedCountryAndTowns();
    await this.seedSuperAdmin();
  }

  private async seedCountryAndTowns() {
    const { country, towns } = CoreSeedData;

    // Find or create country by code
    let countryEntity = await this.countryRepo.findOne({
      where: { code: country.code },
    });
    if (!countryEntity) {
      countryEntity = this.countryRepo.create({
        name: country.name,
        code: country.code,
        phoneCode: country.phoneCode,
      });
      await this.countryRepo.save(countryEntity);
    }

    // Find or create towns
    for (const townName of towns) {
      let townEntity = await this.townRepo.findOne({
        where: { name: townName, country: { id: countryEntity.id } },
      });
      if (!townEntity) {
        townEntity = this.townRepo.create({
          name: townName,
          country: countryEntity,
        });
        await this.townRepo.save(townEntity);
      }
    }
  }

  private async seedSuperAdmin() {
    const { admin } = CoreSeedData;

    // Find or create person by email
    let personEntity = await this.personRepo.findOne({
      where: { email: admin.email },
    });

    if (!personEntity) {
      personEntity = this.personRepo.create({
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        // townId and countryId will be set below
      });
    }

    // Resolve townId and countryId from the seeded data
    const townEntity = await this.townRepo.findOne({
      where: { name: admin.townName },
      relations: { country: true },
    });

    if (!townEntity) {
      throw new Error(
        `Town ${admin.townName} not found. Please seed countries and towns first.`,
      );
    }

    personEntity.townId = townEntity.id;
    personEntity.countryId = townEntity.country.id;

    // Save person if it's new or if we updated town/country
    if (
      !personEntity.id ||
      personEntity.townId !== townEntity.id ||
      personEntity.countryId !== townEntity.country.id
    ) {
      await this.personRepo.save(personEntity);
    }

    // Find or create user for this person
    let userEntity = await this.userRepo.findOne({
      where: { person: { id: personEntity.id } },
      relations: { person: true },
    });

    const inviteTokenExpirySeconds =
      this.configService.get<number>('JWT_INVITE_EXPIRE_AT') || 86400; // 24h default
    const superAdminInviteExpiry = inviteTokenExpirySeconds * 7; // 7 days for super admin

    if (!userEntity) {
      // Create new user
      userEntity = this.userRepo.create({
        person: personEntity,
        passwordHash: null, // User will set password on first login
        isFirstLogin: true,
      });
      await this.userRepo.save(userEntity);
    } else {
      // User exists
      if (userEntity.isFirstLogin === false) {
        // Already activated, skip (don't touch)
        return;
      }
      // If isFirstLogin is true, we will regenerate the invite token (re-seed safe)
    }

    // Find or create AppProfile for ADMIN
    let appProfileEntity = await this.appProfileRepo.findOne({
      where: { user: { id: userEntity.id }, appCode: AppCode.ADMIN },
    });

    if (!appProfileEntity) {
      appProfileEntity = this.appProfileRepo.create({
        user: userEntity,
        appCode: AppCode.ADMIN,
      });
      await this.appProfileRepo.save(appProfileEntity);
    }

    // Find or create AppRole for SUPER_ADMIN
    let appRoleEntity = await this.appRoleRepo.findOne({
      where: {
        appProfile: { id: appProfileEntity.id },
        roleName: AppRoleEnum.SUPER_ADMIN,
      },
    });

    if (!appRoleEntity) {
      appRoleEntity = this.appRoleRepo.create({
        appProfileId: appProfileEntity.id,
        roleName: AppRoleEnum.SUPER_ADMIN,
      });
      await this.appRoleRepo.save(appRoleEntity);
    }

    // Generate invite JWT
    const tokenPayload = {
      userId: userEntity.id,
      type: 'invite',
      appCode: AppCode.ADMIN,
    };

    const inviteToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.get<string>('JWT_INVITE_SECRET'),
      expiresIn: superAdminInviteExpiry,
    });

    // Hash the token for storage
    const inviteTokenHash = crypto
      .createHash('sha256')
      .update(inviteToken)
      .digest('hex');

    // Set invite token and expiry on user
    userEntity.inviteToken = inviteTokenHash;
    userEntity.inviteTokenExpires = new Date(
      Date.now() + superAdminInviteExpiry * 1000,
    );

    await this.userRepo.save(userEntity);

    // Log the raw invite token to console with banner
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/auth/accept-invite?token=${inviteToken}`;

    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  SUPER ADMIN INVITE TOKEN (one-time, expires in 7d)  ║');
    console.log('║  Send this link to the admin:                        ║');
    console.log(`║  ${inviteLink} ║`);
    console.log('╚══════════════════════════════════════════════════════╝');
  }
}
