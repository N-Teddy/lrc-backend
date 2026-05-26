import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { User } from '@app/database/entities/core/user.entity';
import { AppProfile } from '@app/database/entities/core/app-profile.entity';
import { AppRole as AppRoleEntity } from '@app/database/entities/core/app-role.entity';
import { Person } from '@app/database/entities/core/person.entity';
import { AppException } from '@app/common';
import { AppErrorCode, UserPayload, AppCode, AppRole } from '@app/types';
import { PasswordService } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '@app/common';
import { NotificationType, NotificationChannel } from '@app/types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ProvisionUserDto } from './dto/provision-user.dto';
import { ResendInviteDto } from './dto/resend-invite.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AppProfile)
    private readonly profileRepo: Repository<AppProfile>,
    @InjectRepository(AppRoleEntity)
    private readonly roleRepo: Repository<AppRoleEntity>,
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  private getValidRolesForApp(appCode: AppCode): AppRole[] {
    switch (appCode) {
      case AppCode.ADMIN:
        return [AppRole.SUPER_ADMIN];
      case AppCode.JRS:
        return [AppRole.JRS_ADMIN, AppRole.JRS_PC, AppRole.JRS_AP];
      case AppCode.FINANCE:
        return [
          AppRole.FINANCE_ADMIN,
          AppRole.FINANCE_OFFICER,
          AppRole.FINANCE_VIEWER,
        ];
      default:
        return [];
    }
  }

  async validateUser(email: string, pass: string): Promise<User> {
    const person = await this.personRepo.findOne({
      where: { email },
      relations: ['user', 'user.appProfiles', 'user.appProfiles.roles'],
    });

    if (!person || !person.user) {
      throw AppException.unauthorized(
        'Invalid credentials',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    const isValid = await this.passwordService.verify(
      person.user.passwordHash!,
      pass,
    );
    if (!isValid) {
      throw AppException.unauthorized(
        'Invalid credentials',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    return person.user;
  }

  async login(user: User, targetApp: AppCode) {
    // Block login if user has not set password yet (invite not accepted)
    if (!user.passwordHash) {
      throw AppException.forbidden(
        'Account not yet activated. Check your email for the invite link.',
        AppErrorCode.ACCOUNT_NOT_ACTIVATED,
      );
    }

    const person = await this.personRepo.findOne({
      where: { id: user.personId },
    });
    if (!person) {
      throw new AppException(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    // Ensure location is set for user (required for geographic security)
    if (!person.townId || !person.countryId) {
      throw AppException.forbidden(
        'User location not assigned. Contact administrator.',
      );
    }

    const profile = user.appProfiles?.find(
      (p) => p.appCode === targetApp && p.isActive,
    );
    if (!profile && targetApp !== AppCode.AUTH) {
      throw AppException.forbidden(`User does not have access to ${targetApp}`);
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepo.save(user);

    const payload: UserPayload = {
      sub: user.id,
      personId: user.personId,
      email: person.email,
      townId: person.townId,
      countryId: person.countryId,
      profiles:
        user.appProfiles?.map((p) => ({
          app: p.appCode,
          roles: p.roles.map((r) => r.roleName),
        })) || [],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<number>(
      'JWT_REFRESH_EXPIRE_AT',
    );
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        fullName: person.fullName,
        email: person.email,
        appProfiles: payload.profiles,
      },
      isFirstLogin: user.isFirstLogin,
    };
  }

  async refreshToken(refreshToken: string) {
    // Basic diagnostic header (no secrets ever logged)
    const tokenPrefix = refreshToken
      ? refreshToken.substring(0, Math.min(60, refreshToken.length))
      : 'null';
    this.logger.debug(`refreshToken: payload prefix="${tokenPrefix}"`);

    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');
      const secretLen = refreshSecret ? refreshSecret.length : 0;
      this.logger.debug(
        `refreshToken: JWT_REFRESH_SECRET loaded, length=${secretLen}`,
      );

      const payload = this.jwtService.verify<UserPayload>(refreshToken, {
        secret: refreshSecret,
      });

      // Load user to verify still exists
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw AppException.unauthorized(
          'User not found',
          AppErrorCode.AUTH_INVALID_CREDENTIALS,
        );
      }

      // Reload user's profiles fresh from DB instead of trusting the stale profiles in the JWT payload
      const freshUser = await this.userRepo.findOne({
        where: { id: payload.sub },
        relations: ['appProfiles', 'appProfiles.roles'],
      });
      if (!freshUser) {
        throw AppException.unauthorized(
          'User not found',
          AppErrorCode.AUTH_INVALID_CREDENTIALS,
        );
      }

      // Issue new tokens with fresh profiles
      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        personId: payload.personId,
        email: payload.email,
        townId: payload.townId,
        countryId: payload.countryId,
        profiles:
          freshUser.appProfiles?.map((p) => ({
            app: p.appCode,
            roles: p.roles.map((r) => r.roleName),
          })) || [],
      });

      const newRefreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');
      const refreshExpiresIn = this.configService.get<number>(
        'JWT_REFRESH_EXPIRE_AT',
      );
      // Strip server-internal claims before re-signing (jsonwebtoken refuses to overwrite exp)
      const {
        exp: _exp,
        iat: _iat,
        nbf: _nbf,
        ...payloadForToken
      } = payload as any;
      const newRefreshToken = this.jwtService.sign(payloadForToken, {
        secret: newRefreshSecret,
        expiresIn: refreshExpiresIn,
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error: unknown) {
      const name = error instanceof Error ? error.name : typeof error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : null;
      this.logger.error(
        `Refresh token verification failed [${name}]: ${message}`,
        stack,
      );
      throw AppException.unauthorized(
        'Invalid refresh token',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }
  }

  async provisionUser(dto: ProvisionUserDto) {
    const { personId, appCode, roles } = dto;

    // Verify person exists
    const person = await this.personRepo.findOne({ where: { id: personId } });
    if (!person) {
      throw AppException.notFound(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    // Verify location is set
    if (!person.townId || !person.countryId) {
      throw AppException.badRequest(
        'User location not assigned. Contact administrator.',
        AppErrorCode.VALIDATION_FAILED,
      );
    }

    // Verify each role is valid for the given appCode
    const validRolesForApp = this.getValidRolesForApp(appCode);
    for (const role of roles) {
      if (!validRolesForApp.includes(role)) {
        throw AppException.badRequest(
          `Invalid role ${role} for app ${appCode}`,
          AppErrorCode.VALIDATION_FAILED,
        );
      }
    }

    // Check if user exists for this person
    let user = await this.userRepo.findOne({ where: { personId } });
    const isNewUser = !user;

    if (isNewUser) {
      // Create user with null password hash and first login flag
      user = this.userRepo.create({
        personId,
        passwordHash: null,
        isFirstLogin: true,
      });
      user = await this.userRepo.save(user);
    }

    // Get or create app profile for this user and appCode
    let profile = await this.profileRepo.findOne({
      where: { userId: user!.id, appCode },
    });

    if (!profile) {
      profile = this.profileRepo.create({
        userId: user!.id,
        appCode,
        isActive: true,
      });
      profile = await this.profileRepo.save(profile);
    } else if (!profile.isActive) {
      // Reactivate if deactivated
      profile.isActive = true;
      profile = await this.profileRepo.save(profile);
    }

    // Assign roles (skip duplicates)
    for (const roleName of roles) {
      const existingRole = await this.roleRepo.findOne({
        where: { appProfileId: profile.id, roleName },
      });
      if (!existingRole) {
        const role = this.roleRepo.create({
          appProfileId: profile.id,
          roleName,
        });
        await this.roleRepo.save(role);
      }
    }

    // Generate invite token (JWT)
    const inviteSecret = this.configService.get<string>('JWT_INVITE_SECRET');
    const inviteExpiresIn = this.configService.get<number>(
      'JWT_INVITE_EXPIRE_AT',
      86400, // default 24h
    );

    const rawToken = this.jwtService.sign(
      { userId: user!.id, type: 'invite', appCode },
      {
        secret: inviteSecret,
        expiresIn: inviteExpiresIn,
      },
    );

    // Store hash of token and expiry
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenExpires = new Date(Date.now() + inviteExpiresIn * 1000);

    user!.inviteToken = tokenHash;
    user!.inviteTokenExpires = tokenExpires;
    await this.userRepo.save(user!);

    // Send invite email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const appName = this.configService.get<string>('APP_NAME') || appCode;
    try {
      await this.notificationService.sendToUser(
        person.id,
        {
          title: `You've been invited to ${appName}`,
          body: `You have been granted access to ${appName}.`,
          actionUrl: `${frontendUrl}/auth/accept-invite?token=${rawToken}`,
          data: {
            fullName: person.fullName,
            appName,
            expiresIn: '24 hours',
          },
        },
        {
          type: NotificationType.INVITE,
          channels: [NotificationChannel.EMAIL],
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send invite notification to user ${person.id}: ${(error as Error).message}`,
      );
    }

    return {
      userId: user!.id,
      profileId: profile.id,
      roles: roles.map((r) => ({ roleName: r })),
    };
  }

  async resendInvite(dto: ResendInviteDto) {
    const { personId, appCode } = dto;

    // Find user and profile
    const user = await this.userRepo.findOne({ where: { personId } });
    if (!user) {
      throw AppException.notFound(
        'User not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    const profile = await this.profileRepo.findOne({
      where: { userId: user.id, appCode },
    });
    if (!profile) {
      throw AppException.notFound(
        'Profile not found for this app',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    // Generate new invite token
    const inviteSecret = this.configService.get<string>('JWT_INVITE_SECRET');
    const inviteExpiresIn = this.configService.get<number>(
      'JWT_INVITE_EXPIRE_AT',
      86400, // default 24h
    );

    const rawToken = this.jwtService.sign(
      { userId: user.id, type: 'invite', appCode },
      {
        secret: inviteSecret,
        expiresIn: inviteExpiresIn,
      },
    );

    // Update token hash and expiry
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenExpires = new Date(Date.now() + inviteExpiresIn * 1000);

    user.inviteToken = tokenHash;
    user.inviteTokenExpires = tokenExpires;
    await this.userRepo.save(user);

    // Get person for email
    const person = await this.personRepo.findOne({ where: { id: personId } });
    if (!person) {
      throw AppException.notFound(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    // Send invite email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const appName = this.configService.get<string>('APP_NAME') || appCode;
    try {
      await this.notificationService.sendToUser(
        person.id,
        {
          title: `You've been invited to ${appName}`,
          body: `You have been granted access to ${appName}.`,
          actionUrl: `${frontendUrl}/auth/accept-invite?token=${rawToken}`,
          data: {
            fullName: person.fullName,
            appName,
            expiresIn: '24 hours',
          },
        },
        {
          type: NotificationType.INVITE,
          channels: [NotificationChannel.EMAIL],
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send resend invite notification to user ${person.id}: ${(error as Error).message}`,
      );
    }

    return { message: 'Invite resent successfully' };
  }

  async acceptInvite(
    token: string,
    newPassword: string,
    confirmPassword: string,
    appCode?: AppCode,
  ) {
    if (newPassword !== confirmPassword) {
      throw AppException.badRequest(
        'Passwords do not match',
        AppErrorCode.VALIDATION_FAILED,
      );
    }

    // Strip accidental quotes (common frontend localStorage bug) and whitespace
    token = token.replace(/^["']|["']$/g, '').trim();

    // Verify and decode the JWT
    const inviteSecret = this.configService.get<string>('JWT_INVITE_SECRET');
    let payload: { userId: string; type: string; appCode: AppCode };
    try {
      payload = this.jwtService.verify(token, { secret: inviteSecret });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'unknown';
      throw AppException.invalid(
        `Invalid or expired invite token (verify failed: ${msg})`,
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    if (payload.type !== 'invite') {
      throw AppException.invalid(
        'Invalid token type',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    const finalAppCode = appCode ?? payload.appCode;

    // Hash the incoming token and compare with stored hash
    const incomingTokenHash = createHash('sha256').update(token).digest('hex');

    const user = await this.userRepo.findOne({
      where: { id: payload.userId },
      relations: ['appProfiles', 'appProfiles.roles'],
    });
    if (!user) {
      throw AppException.invalid(
        'Invalid or expired invite token (user not found)',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    // Verify token hash matches and token hasn't expired
    if (user.inviteToken !== incomingTokenHash) {
      throw AppException.invalid(
        'Invalid or expired invite token (hash mismatch - you might be using an old invite link)',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    if (user.inviteTokenExpires && user.inviteTokenExpires < new Date()) {
      throw AppException.invalid(
        'Invite token has expired (date past)',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    // Hash the new password
    const passwordHash = await this.passwordService.hash(newPassword);

    // Update user
    user.passwordHash = passwordHash;
    user.isFirstLogin = false;
    user.inviteToken = null;
    user.inviteTokenExpires = null;
    await this.userRepo.save(user);

    // Immediately issue access and refresh tokens for the target appCode from the token payload
    const person = await this.personRepo.findOne({
      where: { id: user.personId },
      relations: ['town', 'country'],
    });
    if (!person) {
      throw AppException.notFound(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    // Ensure location is set (should be, but double-check)
    if (!person.townId || !person.countryId) {
      throw AppException.forbidden(
        'User location not assigned. Contact administrator.',
      );
    }

    const profile = user.appProfiles?.find(
      (p) => p.appCode === finalAppCode && p.isActive,
    );
    if (!profile && finalAppCode !== AppCode.AUTH) {
      throw AppException.forbidden(
        `User does not have access to ${finalAppCode}`,
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepo.save(user);

    const payloadForToken: UserPayload = {
      sub: user.id,
      personId: user.personId,
      email: person.email,
      townId: person.townId,
      countryId: person.countryId,
      profiles:
        user.appProfiles?.map((p) => ({
          app: p.appCode,
          roles: p.roles.map((r) => r.roleName),
        })) || [],
    };

    const accessToken = this.jwtService.sign(payloadForToken);
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<number>(
      'JWT_REFRESH_EXPIRE_AT',
    );
    const refreshToken = this.jwtService.sign(payloadForToken, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        fullName: person.fullName,
        email: person.email,
        appProfiles: payloadForToken.profiles,
      },
      isFirstLogin: false, // Just set password, so not first login anymore
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: [
        'person',
        'person.town',
        'person.country',
        'appProfiles',
        'appProfiles.roles',
      ],
    });

    if (!user) {
      throw AppException.notFound(
        'User not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    return {
      id: user.id,
      fullName: user.person.fullName,
      email: user.person.email,
      phone: user.person.phone,
      picture: user.person.picture,
      town: user.person.town,
      country: user.person.country,
      appProfiles:
        user.appProfiles?.map((p) => ({
          app: p.appCode,
          roles: p.roles.map((r) => r.roleName),
        })) || [],
      lastLogin: user.lastLogin,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['person'],
    });

    if (!user) {
      throw AppException.notFound(
        'User not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    // Explicit field mapping — only fields present in UpdateProfileDto are written
    if (dto.fullName !== undefined) user.person.fullName = dto.fullName;
    if (dto.phone !== undefined) user.person.phone = dto.phone;
    if (dto.picture !== undefined) user.person.picture = dto.picture;
    return this.personRepo.save(user.person);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { oldPassword, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw AppException.badRequest(
        'New passwords do not match',
        AppErrorCode.VALIDATION_FAILED,
      );
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw AppException.notFound(
        'User not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    const isValid = await this.passwordService.verify(
      user.passwordHash!,
      oldPassword,
    );
    if (!isValid) {
      throw AppException.unauthorized(
        'Old password is incorrect',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    user.passwordHash = await this.passwordService.hash(newPassword);
    await this.userRepo.save(user);

    return { message: 'Password changed successfully' };
  }

  async requestPasswordReset(email: string) {
    const person = await this.personRepo.findOne({
      where: { email },
      relations: ['user'],
    });

    if (!person || !person.user) {
      // Do not reveal if user exists
      return {
        message:
          'If an account exists with this email, a reset link will be sent.',
      };
    }

    // Generate JWT token for password reset
    const resetSecret = this.configService.get<string>('JWT_RESET_SECRET');
    const resetExpiresIn = this.configService.get<number>(
      'JWT_RESET_EXPIRE_AT',
      3600,
    );

    const rawToken = this.jwtService.sign(
      { userId: person.user.id, type: 'password-reset' },
      {
        secret: resetSecret,
        expiresIn: resetExpiresIn,
      },
    );
    const resetExpires = new Date(Date.now() + resetExpiresIn * 1000);

    // Store token hash in user (token will be sent via email)
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    person.user.passwordResetToken = tokenHash;
    person.user.passwordResetExpires = resetExpires;
    await this.userRepo.save(person.user);

    // Send password reset notification
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    try {
      await this.notificationService.sendToUser(
        person.id,
        {
          title: 'Password Reset Request',
          body: 'You requested a password reset. Click the link below to proceed.',
          actionUrl: `${frontendUrl}/auth/reset-password?token=${rawToken}`,
          data: {
            expiresIn: '1 hour',
          },
        },
        {
          type: NotificationType.PASSWORD_RESET,
          channels: [NotificationChannel.EMAIL],
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset notification to user ${person.id}: ${(error as Error).message}`,
      );
    }

    return {
      message:
        'If an account exists with this email, a reset link will be sent.',
    };
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    const resetSecret = this.configService.get<string>('JWT_RESET_SECRET');

    let payload: { userId: string; type: string };
    try {
      payload = this.jwtService.verify(token, { secret: resetSecret });
    } catch (_: unknown) {
      throw AppException.invalid(
        'Invalid or expired reset token',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    if (payload.type !== 'password-reset') {
      throw AppException.invalid(
        'Invalid token type',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    // Hash the incoming token and compare with stored hash
    const incomingTokenHash = createHash('sha256').update(token).digest('hex');

    const user = await this.userRepo.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw AppException.invalid(
        'Invalid or expired reset token',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    // Verify token hash matches and token hasn't expired
    if (user.passwordResetToken !== incomingTokenHash) {
      throw AppException.invalid(
        'Invalid or expired reset token',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw AppException.invalid(
        'Reset token has expired',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
      );
    }

    user.passwordHash = await this.passwordService.hash(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.userRepo.save(user);

    return { message: 'Password reset successfully' };
  }

  async promoteToUser(personId: string, password: string) {
    const person = await this.personRepo.findOne({
      where: { id: personId },
      relations: ['user'],
    });
    if (!person)
      throw new AppException(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    if (person.user)
      throw new AppException(
        'User already exists for this person',
        AppErrorCode.DB_DUPLICATE_ENTRY,
      );

    const passwordHash = await this.passwordService.hash(password);
    const user = this.userRepo.create({
      personId,
      passwordHash,
    });

    return this.userRepo.save(user);
  }

  async createUserWithProfile(dto: {
    personId: string;
    appCode: AppCode;
    roles?: string[];
    password?: string;
  }) {
    const { personId, appCode, roles = [], password } = dto;

    const person = await this.personRepo.findOne({
      where: { id: personId },
      relations: ['user'],
    });
    if (!person) {
      throw AppException.notFound(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    let user = person.user;
    if (!user) {
      const generatedPassword = password || this.generateTempPassword();
      const passwordHash = await this.passwordService.hash(generatedPassword);
      user = this.userRepo.create({
        personId: person.id,
        passwordHash,
      });
      user = await this.userRepo.save(user);
    }

    const existingProfile = await this.profileRepo.findOne({
      where: { userId: user.id, appCode },
    });

    let profile: AppProfile;
    if (existingProfile) {
      profile = existingProfile;
    } else {
      profile = this.profileRepo.create({
        userId: user.id,
        appCode,
        isActive: true,
      });
      profile = await this.profileRepo.save(profile);
    }

    for (const roleName of roles) {
      const existingRole = await this.roleRepo.findOne({
        where: { appProfileId: profile.id, roleName },
      });
      if (!existingRole) {
        const role = this.roleRepo.create({
          appProfileId: profile.id,
          roleName,
        });
        await this.roleRepo.save(role);
      }
    }

    return { user, profile };
  }

  async assignRoles(dto: {
    personId: string;
    appCode: AppCode;
    roles: string[];
  }) {
    const { personId, appCode, roles } = dto;

    const person = await this.personRepo.findOne({
      where: { id: personId },
      relations: ['user'],
    });
    if (!person?.user) {
      throw AppException.notFound(
        'User not found for this person',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    const profile = await this.profileRepo.findOne({
      where: { userId: person.user.id, appCode },
    });
    if (!profile) {
      throw AppException.notFound(
        'Profile not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    for (const roleName of roles) {
      const existingRole = await this.roleRepo.findOne({
        where: { appProfileId: profile.id, roleName },
      });
      if (!existingRole) {
        const role = this.roleRepo.create({
          appProfileId: profile.id,
          roleName,
        });
        await this.roleRepo.save(role);
      }
    }

    return { profileId: profile.id, assignedRoles: roles };
  }

  async removeRoles(dto: {
    personId: string;
    appCode: AppCode;
    roles: string[];
  }) {
    const { personId, appCode, roles } = dto;

    const person = await this.personRepo.findOne({
      where: { id: personId },
      relations: ['user'],
    });
    if (!person?.user) {
      throw AppException.notFound(
        'User not found for this person',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    const profile = await this.profileRepo.findOne({
      where: { userId: person.user.id, appCode },
    });
    if (!profile) {
      throw AppException.notFound(
        'Profile not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    for (const roleName of roles) {
      await this.roleRepo.delete({
        appProfileId: profile.id,
        roleName,
      });
    }

    return { profileId: profile.id, removedRoles: roles };
  }

  async deactivateProfile(dto: { personId: string; appCode: AppCode }) {
    const { personId, appCode } = dto;

    const person = await this.personRepo.findOne({
      where: { id: personId },
      relations: ['user'],
    });
    if (!person?.user) {
      throw AppException.notFound(
        'User not found for this person',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    const profile = await this.profileRepo.findOne({
      where: { userId: person.user.id, appCode },
    });
    if (!profile) {
      throw AppException.notFound(
        'Profile not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    profile.isActive = false;
    await this.profileRepo.save(profile);

    return { profileId: profile.id, isActive: false };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
