import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCentreRenewalAndActivityFields1778946504000 implements MigrationInterface {
  name = 'AddCentreRenewalAndActivityFields1778946504000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_centre_renewal to towns
    await queryRunner.query(
      `ALTER TABLE "core"."towns" ADD "is_centre_renewal" boolean NOT NULL DEFAULT false`,
    );

    // Add status and lock fields to activities
    await queryRunner.query(
      `CREATE TYPE "jrs"."activities_status_enum" AS ENUM('PROGRAMMED', 'CANCELLED', 'POSTPONED', 'COMPLETED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ADD "status" "jrs"."activities_status_enum" NOT NULL DEFAULT 'PROGRAMMED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ADD "is_locked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ADD "locked_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ADD "locked_by_id" uuid`,
    );

    // Update ActivityType enum to add SEMAINE and JPO
    await queryRunner.query(
      `ALTER TYPE "jrs"."activities_activitytype_enum" ADD VALUE IF NOT EXISTS 'SEMAINE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "jrs"."activities_activitytype_enum" ADD VALUE IF NOT EXISTS 'JPO'`,
    );

    // Update notification types enum
    await queryRunner.query(
      `ALTER TYPE "notifications"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'JRS_ACTIVITY_CREATED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "notifications"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'JRS_ACTIVITY_CANCELLED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "notifications"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'JRS_ACTIVITY_ARCHIVED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "notifications"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'JRS_ACTIVITY_ATTENDANCE_LOCKED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "notifications"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'JRS_ACTIVITY_MISSED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "locked_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "locked_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "is_locked"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "status"`,
    );
    await queryRunner.query(`DROP TYPE "jrs"."activities_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "core"."towns" DROP COLUMN "is_centre_renewal"`,
    );
  }
}
