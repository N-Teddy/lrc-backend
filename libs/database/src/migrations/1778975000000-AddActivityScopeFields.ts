import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityScopeFields1778975000000 implements MigrationInterface {
  name = 'AddActivityScopeFields1778975000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add activity scope enum
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activities_scope_enum') THEN CREATE TYPE "jrs"."activities_scope_enum" AS ENUM('TOWN', 'COUNTRY'); END IF; END $$;`,
    );

    // Add country_id column
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ADD "country_id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'`,
    );

    // Add scope column
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ADD "scope" "jrs"."activities_scope_enum" NOT NULL DEFAULT 'TOWN'`,
    );

    // Add originating_centre_id column
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ADD "originating_centre_id" uuid`,
    );

    // Add country_id foreign key to towns
    await queryRunner.query(
      `ALTER TABLE "core"."towns" ADD CONSTRAINT "FK_country_town" FOREIGN KEY ("country_id") REFERENCES "core"."countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Update existing activities with proper country_id and scope
    await queryRunner.query(
      `UPDATE "jrs"."activities" a SET "country_id" = t.country_id FROM "core"."towns" t WHERE a.town_id = t.id`,
    );

    // Remove default from country_id after update
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ALTER COLUMN "country_id" DROP DEFAULT`,
    );

    // Make town_id nullable for COUNTRY scope activities
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ALTER COLUMN "town_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."towns" DROP CONSTRAINT "FK_country_town"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "originating_centre_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "scope"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "country_id"`,
    );
    await queryRunner.query(`DROP TYPE "jrs"."activities_scope_enum"`);
  }
}
