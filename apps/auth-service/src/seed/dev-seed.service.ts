import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PEOPLE_SEED_DATA } from './data/people-seed.data';
import { JRS_SEED_DATA } from './data/jrs-seed.data';
import { Country } from '@app/database';
import { Town } from '@app/database';
import { GradeLevel } from '@app/database';
import { Person } from '@app/database';
import { User } from '@app/database';
import { AppProfile } from '@app/database';
import { AppRole } from '@app/database';
import { AppCode } from '@app/types';
import { PasswordService } from '@app/common';
import { NotificationService } from '@app/common';
import * as crypto from 'crypto';
import { SeedService } from './seed.service';

@Injectable()
export class DevSeedService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(Town) private readonly townRepo: Repository<Town>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
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
    private readonly seedService: SeedService,
  ) {}

  async runDevSeed() {
    // Run core seed first
    await this.seedService.seed();

    // Then run dev-specific seeding
    await this.seedTestPeople();
    await this.seedJrsUsers();
  }

  private async seedTestPeople() {
    const { people } = PEOPLE_SEED_DATA;

    for (const personData of people) {
      // Find or create person by email
      let personEntity = await this.personRepo.findOne({
        where: { email: personData.email },
      });

      if (!personEntity) {
        // Resolve grade level entity for 'create'
        const gradeLevelEntity = await this.gradeLevelRepo.findOne({
          where: { name: personData.grade },
        });
        personEntity = this.personRepo.create({
          ...personData,
          gradeLevelId: gradeLevelEntity?.id,
        });
      } else {
        // Update fields if they changed (though seed data should be stable)
        Object.assign(personEntity, {
          ...personData,
          gradeLevelId: personEntity.gradeLevelId, // preserve existing grade level id
        });
      }

      // Resolve townId from townName
      const townEntity = await this.townRepo.findOne({
        where: { name: personData.townName },
      });

      if (!townEntity) {
        console.warn(
          `Town ${personData.townName} not found for person ${personData.email}`,
        );
        continue;
      }

      personEntity.townId = townEntity.id;
      // countryId will be set via the town's country relationship in the entity

      await this.personRepo.save(personEntity);
    }
  }

  private async seedJrsUsers() {
    const { members } = JRS_SEED_DATA;
    const inviteTokenExpirySeconds =
      this.configService.get<number>('JWT_INVITE_EXPIRE_AT') || 86400; // 24h default

    console.log(
      '\n╔═════════════════════════════════════════════════════════════════════════════════════════╗',
    );
    console.log(
      '║                     JRS DEV SEED INVITE TOKENS                            ║',
    );
    console.log(
      '║  (24-hour expiry, for development only)                                   ║',
    );
    console.log(
      '╚═════════════════════════════════════════════════════════════════════════════════════════╝',
    );
    console.log('');

    // Table header
    console.log(
      '┌─────────────────────┬──────────┬──────────────────────────────────────────┐',
    );
    console.log(
      '│ Name                │ Role     │ Invite Link                              │',
    );
    console.log(
      '├─────────────────────┼──────────┼──────────────────────────────────────────┤',
    );

    for (const memberData of members) {
      // Find or create person by email
      let personEntity = await this.personRepo.findOne({
        where: { email: memberData.personData.email },
      });

      if (!personEntity) {
        personEntity = this.personRepo.create({
          ...memberData.personData,
          // townId and countryId will be set below
        });
      }

      // Resolve townId from townName
      const townEntity = await this.townRepo.findOne({
        where: { name: memberData.townName },
        relations: { country: true },
      });

      if (!townEntity) {
        console.warn(
          `Town ${memberData.townName} not found for JRS member ${memberData.personData.email}`,
        );
        continue;
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

      let isNewUser = false;
      let statusMessage = '';

      if (!userEntity) {
        // Create new user
        userEntity = this.userRepo.create({
          person: personEntity,
          passwordHash: null, // User will set password on first login
          isFirstLogin: true,
        });
        isNewUser = true;
        statusMessage = 'CREATED';
      } else {
        // User exists
        if (userEntity.isFirstLogin === false) {
          // Already activated, skip and log
          statusMessage = 'ALREADY_ACTIVATED';
          // Still need to create app profile and role if they don't exist
        } else {
          // User exists and isFirstLogin is true, we'll regenerate invite token
          statusMessage = 'REGENERATED';
        }
      }

      // Save user if new or if we need to update isFirstLogin (though it should be true for dev seed)
      if (isNewUser || !userEntity.isFirstLogin) {
        await this.userRepo.save(userEntity);
      }

      // Find or create AppProfile for JRS
      let appProfileEntity = await this.appProfileRepo.findOne({
        where: { user: { id: userEntity.id }, appCode: AppCode.JRS },
      });

      if (!appProfileEntity) {
        appProfileEntity = this.appProfileRepo.create({
          user: userEntity,
          appCode: AppCode.JRS,
        });
        await this.appProfileRepo.save(appProfileEntity);
      }

      // Find or create AppRole for the mapped role
      let appRoleEntity = await this.appRoleRepo.findOne({
        where: {
          appProfile: { id: appProfileEntity.id },
          roleName: memberData.role,
        },
      });

      if (!appRoleEntity) {
        appRoleEntity = this.appRoleRepo.create({
          appProfileId: appProfileEntity.id,
          roleName: memberData.role,
        });
        await this.appRoleRepo.save(appRoleEntity);
      }

      // Generate invite JWT (only if we need to set/update the token)
      let inviteToken: string | null = null;
      if (
        isNewUser ||
        userEntity.isFirstLogin === true ||
        statusMessage === 'REGENERATED'
      ) {
        const tokenPayload = {
          userId: userEntity.id,
          type: 'invite',
          appCode: AppCode.JRS,
        };

        inviteToken = this.jwtService.sign(tokenPayload, {
          secret: this.configService.get<string>('JWT_INVITE_SECRET'),
          expiresIn: inviteTokenExpirySeconds,
        });

        // Hash the token for storage
        const inviteTokenHash = crypto
          .createHash('sha256')
          .update(inviteToken)
          .digest('hex');

        // Set invite token and expiry on user
        userEntity.inviteToken = inviteTokenHash;
        userEntity.inviteTokenExpires = new Date(
          Date.now() + inviteTokenExpirySeconds * 1000,
        );

        await this.userRepo.save(userEntity);
      }

      // Format the output for the table
      const name = memberData.personData.fullName.padEnd(19);
      const role = memberData.role.padEnd(8);

      let inviteLink = '';
      if (inviteToken) {
        const frontendUrl =
          this.configService.get<string>('FRONTEND_URL') ||
          'http://localhost:3000';
        inviteLink = `${frontendUrl}/auth/accept-invite?token=${inviteToken}`;
      } else {
        inviteLink = '(already activated)';
      }

      // Truncate invite link if too long for display
      const displayLink =
        inviteLink.length > 34
          ? inviteLink.substring(0, 31) + '...'
          : inviteLink;
      const paddedLink = displayLink.padEnd(34);

      console.log(`│ ${name} │ ${role} │ ${paddedLink} │`);
    }

    // Table footer
    console.log(
      '└─────────────────────┴──────────┴──────────────────────────────────────────┘',
    );
    console.log('');
  }
}
