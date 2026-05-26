import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository, EntityManager } from 'typeorm';
import { Person } from '@app/database/entities/core/person.entity';
import { JrsMember } from '@app/database/entities/jrs/jrs-member.entity';
import { NotificationService } from '@app/common/notification/notification.service';
import { NotificationType, NotificationChannel } from '@app/types';

interface PersonRow {
  id: string;
}

@Injectable()
export class BirthdayService {
  private readonly logger = new Logger(BirthdayService.name);

  constructor(
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    private notificationService: NotificationService,
    @InjectEntityManager()
    private entityManager: EntityManager,
  ) {}

  async getBirthdaysThisMonth(): Promise<Person[]> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return this.personRepository
      .createQueryBuilder('person')
      .innerJoin(JrsMember, 'jrsMember', 'jrsMember.personId = person.id')
      .where('EXTRACT(MONTH FROM person.dob) = :month', { month })
      .andWhere('EXTRACT(YEAR FROM person.dob) = :year', { year })
      .andWhere('person.isArchived = :isArchived', { isArchived: false })
      .getMany();
  }

  @Cron('0 0 8 * * *', {
    name: 'sendBirthdayNotifications',
    timeZone: 'Africa/Douala',
  })
  async sendBirthdayNotifications(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Persons whose date-of-birth month+day is today
    const birthdays = await this.personRepository
      .createQueryBuilder('person')
      .where('EXTRACT(MONTH FROM person.dob) = :month', {
        month: today.getMonth() + 1,
      })
      .andWhere('EXTRACT(DAY FROM person.dob) = :day', {
        day: today.getDate(),
      })
      .andWhere('person.isArchived = :isArchived', { isArchived: false })
      .getMany();

    if (birthdays.length === 0) {
      this.logger.log('No birthdays today');
      return;
    }

    for (const person of birthdays) {
      this.logger.log(`Sending birthday notification for ${person.fullName}`);

      const recipients = await this.getRecipientsInSameTown(person.townId);

      for (const recipient of recipients) {
        await this.notificationService.sendToUser(
          recipient.id,
          {
            title: `Birthday Reminder: ${person.fullName}`,
            body: `Today is ${person.fullName}'s birthday!`,
          },
          {
            type: NotificationType.JRS_BIRTHDAY_REMINDER,
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          },
        );
      }
    }
  }

  private async getRecipientsInSameTown(
    townId: string | null,
  ): Promise<PersonRow[]> {
    if (!townId) {
      return [];
    }

    return await this.entityManager.query(
      `SELECT person.*
        FROM core.persons person
        INNER JOIN core.users user ON user.person_id = person.id
        INNER JOIN core.app_profiles appProfile ON appProfile.user_id = user.id
        INNER JOIN core.app_roles appRole ON appRole.app_profile_id = appProfile.id
        WHERE appProfile.app_code = $1
          AND appRole.role_name IN ($2, $3)
          AND person.town_id = $4
          AND person.is_archived = false`,
      ['JRS', 'JRS_PC', 'JRS_AP', townId],
    );
  }
}
