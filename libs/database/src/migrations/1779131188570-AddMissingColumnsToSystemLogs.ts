import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsToSystemLogs1779131188570 implements MigrationInterface {
  name = 'AddMissingColumnsToSystemLogs1779131188570';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "logs"."system_logs" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs"."system_logs" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs"."system_logs" ADD COLUMN IF NOT EXISTS "created_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs"."system_logs" ADD COLUMN IF NOT EXISTS "updated_by" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "logs"."system_logs" DROP COLUMN IF EXISTS "updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs"."system_logs" DROP COLUMN IF EXISTS "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs"."system_logs" DROP COLUMN IF EXISTS "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs"."system_logs" DROP COLUMN IF EXISTS "created_at"`,
    );
  }
}
