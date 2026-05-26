import 'dotenv/config';
import { DataSource } from 'typeorm';
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

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'lrc_db',
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
  ],
  migrations: ['libs/database/src/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});
