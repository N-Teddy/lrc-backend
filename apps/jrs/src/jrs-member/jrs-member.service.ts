import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JrsMember } from '@app/database/entities/jrs/jrs-member.entity';
import { Person } from '@app/database/entities/core/person.entity';
import { User } from '@app/database/entities/core/user.entity';
import { AppProfile } from '@app/database/entities/core/app-profile.entity';
import {
  AppCode,
  MemberStatus,
  NotificationType,
  NotificationChannel,
  AppRole,
} from '@app/types';
import { AppException, NotificationService } from '@app/common';
import { AppErrorCode } from '@app/types';
import { CreateMemberDto, UpdateMemberDto, MemberFilterDto } from './dto';
import { AuthService } from '../auth/auth.service';
import type { UserPayload } from '@app/types';

@Injectable()
export class JrsMemberService {
  private readonly logger = new Logger(JrsMemberService.name);

  constructor(
    @InjectRepository(JrsMember)
    private readonly memberRepo: Repository<JrsMember>,
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AppProfile)
    private readonly profileRepo: Repository<AppProfile>,
    private readonly jrsAuthService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateMemberDto, requestingUser: UserPayload) {
    const person = await this.personRepo.findOne({
      where: { id: dto.personId },
      relations: ['user'],
    });

    if (!person) {
      throw AppException.notFound(
        'Person not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    const existingMember = await this.memberRepo.findOne({
      where: { personId: dto.personId },
    });
    if (existingMember) {
      throw AppException.conflict(
        'Person is already a JRS member',
        AppErrorCode.DB_DUPLICATE_ENTRY,
      );
    }

    const member = this.memberRepo.create({
      personId: dto.personId,
      joinDate: new Date(),
      status: dto.status || MemberStatus.ACTIVE,
      isPc: dto.isPc || false,
      isAp: dto.isAp || false,
      hasSystemAccess: dto.hasSystemAccess || false,
    });

    const savedMember = await this.memberRepo.save(member);

    let userId: string | undefined;

    if (dto.hasSystemAccess) {
      const rolesToAssign = this.buildRolesForMember(dto);
      await this.jrsAuthService.createUserWithProfile({
        personId: dto.personId,
        appCode: AppCode.JRS,
        roles: rolesToAssign,
      });

      const updatedPerson = await this.personRepo.findOne({
        where: { id: dto.personId },
        relations: ['user'],
      });
      userId = updatedPerson?.user?.id;
    }

    await this.notifyMemberCreated(savedMember, dto, userId);

    return this.findOne(savedMember.id, requestingUser);
  }

  async findAll(filters: MemberFilterDto, requestingUser: UserPayload) {
    void requestingUser; // Reserved for future authorization checks
    const query = this.memberRepo
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.person', 'person')
      .orderBy('person.fullName', 'ASC');

    if (!filters.includeArchived) {
      query.where('member.status != :status', { status: MemberStatus.LEFT });
    }

    if (filters.status) {
      query.andWhere('member.status = :status', { status: filters.status });
    }

    if (filters.isPc !== undefined) {
      query.andWhere('member.isPc = :isPc', { isPc: filters.isPc });
    }

    if (filters.isAp !== undefined) {
      query.andWhere('member.isAp = :isAp', { isAp: filters.isAp });
    }

    if (filters.gradeLevelId) {
      query.andWhere('person.gradeLevelId = :gradeLevelId', {
        gradeLevelId: filters.gradeLevelId,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [members, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: members,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, requestingUser: UserPayload) {
    void requestingUser; // Reserved for future authorization checks
    const member = await this.memberRepo.findOne({
      where: { id },
      relations: ['person', 'person.town', 'person.country'],
    });

    if (!member) {
      throw AppException.notFound(
        'Member not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    return member;
  }

  async update(id: string, dto: UpdateMemberDto, requestingUser: UserPayload) {
    const member = await this.memberRepo.findOne({
      where: { id },
      relations: ['person'],
    });

    if (!member) {
      throw AppException.notFound(
        'Member not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    const previousHasSystemAccess = member.hasSystemAccess;
    const previousIsPc = member.isPc;
    const previousIsAp = member.isAp;

    if (dto.status !== undefined) {
      member.status = dto.status;
    }
    if (dto.isPc !== undefined) {
      member.isPc = dto.isPc;
    }
    if (dto.isAp !== undefined) {
      member.isAp = dto.isAp;
    }
    if (dto.hasSystemAccess !== undefined) {
      member.hasSystemAccess = dto.hasSystemAccess;
    }

    const savedMember = await this.memberRepo.save(member);

    if (dto.hasSystemAccess && !previousHasSystemAccess) {
      const rolesToAssign = this.getRolesForMember(member);
      await this.jrsAuthService.assignRoles({
        personId: member.personId,
        appCode: AppCode.JRS,
        roles: rolesToAssign,
      });
    } else if (!dto.hasSystemAccess && previousHasSystemAccess) {
      await this.jrsAuthService.deactivateProfile({
        personId: member.personId,
        appCode: AppCode.JRS,
      });
    }

    if (dto.isPc !== undefined && dto.isPc !== previousIsPc) {
      if (dto.isPc) {
        await this.jrsAuthService.assignRoles({
          personId: member.personId,
          appCode: AppCode.JRS,
          roles: [AppRole.JRS_PC],
        });
      } else {
        await this.jrsAuthService.removeRoles({
          personId: member.personId,
          appCode: AppCode.JRS,
          roles: [AppRole.JRS_PC],
        });
      }
    }

    if (dto.isAp !== undefined && dto.isAp !== previousIsAp) {
      if (dto.isAp) {
        await this.jrsAuthService.assignRoles({
          personId: member.personId,
          appCode: AppCode.JRS,
          roles: [AppRole.JRS_AP],
        });
      } else {
        await this.jrsAuthService.removeRoles({
          personId: member.personId,
          appCode: AppCode.JRS,
          roles: [AppRole.JRS_AP],
        });
      }
    }

    return this.findOne(savedMember.id, requestingUser);
  }

  async archive(id: string, requestingUser: UserPayload) {
    void requestingUser; // Reserved for future authorization checks
    const member = await this.memberRepo.findOne({
      where: { id },
    });

    if (!member) {
      throw AppException.notFound(
        'Member not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    // Capture hasSystemAccess before modifying it
    const hadSystemAccess = member.hasSystemAccess;
    member.status = MemberStatus.LEFT;
    member.hasSystemAccess = false;
    await this.memberRepo.save(member);

    if (hadSystemAccess) {
      await this.jrsAuthService.deactivateProfile({
        personId: member.personId,
        appCode: AppCode.JRS,
      });
    }

    await this.notifyMemberArchived(member);

    return member;
  }

  async promoteToPc(id: string, requestingUser: UserPayload) {
    const member = await this.memberRepo.findOne({
      where: { id },
    });

    if (!member) {
      throw AppException.notFound(
        'Member not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    member.isPc = true;
    await this.memberRepo.save(member);

    await this.jrsAuthService.assignRoles({
      personId: member.personId,
      appCode: AppCode.JRS,
      roles: [AppRole.JRS_PC],
    });

    await this.notifyMemberPromoted(member, 'PC');

    return this.findOne(member.id, requestingUser);
  }

  async promoteToAp(id: string, requestingUser: UserPayload) {
    const member = await this.memberRepo.findOne({
      where: { id },
    });

    if (!member) {
      throw AppException.notFound(
        'Member not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    member.isAp = true;
    await this.memberRepo.save(member);

    await this.jrsAuthService.assignRoles({
      personId: member.personId,
      appCode: AppCode.JRS,
      roles: [AppRole.JRS_AP],
    });

    await this.notifyMemberPromoted(member, 'AP');

    return this.findOne(member.id, requestingUser);
  }

  async demoteFromPc(id: string, requestingUser: UserPayload) {
    const member = await this.memberRepo.findOne({
      where: { id },
    });

    if (!member) {
      throw AppException.notFound(
        'Member not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    member.isPc = false;
    await this.memberRepo.save(member);

    await this.jrsAuthService.removeRoles({
      personId: member.personId,
      appCode: AppCode.JRS,
      roles: [AppRole.JRS_PC],
    });

    await this.notifyMemberDemoted(member, 'PC');

    return this.findOne(member.id, requestingUser);
  }

  async demoteFromAp(id: string, requestingUser: UserPayload) {
    const member = await this.memberRepo.findOne({
      where: { id },
    });

    if (!member) {
      throw AppException.notFound(
        'Member not found',
        AppErrorCode.DB_ENTITY_NOT_FOUND,
      );
    }

    member.isAp = false;
    await this.memberRepo.save(member);

    await this.jrsAuthService.removeRoles({
      personId: member.personId,
      appCode: AppCode.JRS,
      roles: [AppRole.JRS_AP],
    });

    await this.notifyMemberDemoted(member, 'AP');

    return this.findOne(member.id, requestingUser);
  }

  private buildRolesForMember(dto: CreateMemberDto): AppRole[] {
    const roles: AppRole[] = [AppRole.JRS_MEMBER];
    if (dto.isPc) roles.push(AppRole.JRS_PC);
    if (dto.isAp) roles.push(AppRole.JRS_AP);
    if (dto.grantRoles) roles.push(...(dto.grantRoles as AppRole[]));
    return roles;
  }

  private getRolesForMember(member: JrsMember): AppRole[] {
    const roles: AppRole[] = [AppRole.JRS_MEMBER];
    if (member.isPc) roles.push(AppRole.JRS_PC);
    if (member.isAp) roles.push(AppRole.JRS_AP);
    return roles;
  }

  private async notifyMemberCreated(
    member: JrsMember,
    dto: CreateMemberDto,
    userId?: string,
  ) {
    void dto; // Reserved for future notification data
    void userId; // Reserved for future user data
    const person = await this.personRepo.findOne({
      where: { id: member.personId },
    });

    if (!person) return;

    const pcsAndAps = await this.memberRepo
      .createQueryBuilder('member')
      .innerJoin('member.person', 'person')
      .where('person.townId = :townId', { townId: person.townId })
      .andWhere('member.status = :status', { status: MemberStatus.ACTIVE })
      .andWhere('(member.isPc = true OR member.isAp = true)')
      .getMany();

    for (const pcAp of pcsAndAps) {
      await this.notificationService.sendToUser(
        pcAp.personId,
        {
          title: 'New JRS Member',
          body: `${person.fullName} has been added as a JRS member`,
          data: { memberId: member.id, personId: member.personId },
        },
        {
          type: NotificationType.JRS_MEMBER_CREATED,
          channels: [NotificationChannel.IN_APP],
        },
      );
    }
  }

  private async notifyMemberArchived(member: JrsMember) {
    const person = await this.personRepo.findOne({
      where: { id: member.personId },
    });

    if (!person) return;

    const pcsAndAps = await this.memberRepo
      .createQueryBuilder('member')
      .innerJoin('member.person', 'person')
      .where('person.townId = :townId', { townId: person.townId })
      .andWhere('member.status = :status', { status: MemberStatus.ACTIVE })
      .andWhere('(member.isPc = true OR member.isAp = true)')
      .getMany();

    for (const pcAp of pcsAndAps) {
      await this.notificationService.sendToUser(
        pcAp.personId,
        {
          title: 'JRS Member Archived',
          body: `${person.fullName} has been archived`,
          data: { memberId: member.id },
        },
        {
          type: NotificationType.JRS_MEMBER_ARCHIVED,
          channels: [NotificationChannel.IN_APP],
        },
      );
    }
  }

  private async notifyMemberPromoted(member: JrsMember, type: 'PC' | 'AP') {
    const person = await this.personRepo.findOne({
      where: { id: member.personId },
    });

    if (!person) return;

    await this.notificationService.sendToUser(
      member.personId,
      {
        title: `Promoted to ${type}`,
        body: `You have been promoted to ${type === 'PC' ? 'Personne Contact' : 'Accompagnateur Parental'}`,
        data: { memberId: member.id, type },
      },
      {
        type:
          type === 'PC'
            ? NotificationType.JRS_MEMBER_PROMOTED_PC
            : NotificationType.JRS_MEMBER_PROMOTED_AP,
        channels: [NotificationChannel.IN_APP],
      },
    );
  }

  private async notifyMemberDemoted(member: JrsMember, type: 'PC' | 'AP') {
    const person = await this.personRepo.findOne({
      where: { id: member.personId },
    });

    if (!person) return;

    await this.notificationService.sendToUser(
      member.personId,
      {
        title: `Demoted from ${type}`,
        body: `You have been removed as ${type === 'PC' ? 'Personne Contact' : 'Accompagnateur Parental'}`,
        data: { memberId: member.id, type },
      },
      {
        type:
          type === 'PC'
            ? NotificationType.JRS_MEMBER_DEMOTED_PC
            : NotificationType.JRS_MEMBER_DEMOTED_AP,
        channels: [NotificationChannel.IN_APP],
      },
    );
  }
}
