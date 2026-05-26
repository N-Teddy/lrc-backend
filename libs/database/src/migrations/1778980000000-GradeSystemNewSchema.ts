import { MigrationInterface, QueryRunner } from 'typeorm';

export class GradeSystemNewSchema1778980000000 implements MigrationInterface {
  name = 'GradeSystemNewSchema1778980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create grade_categories table
    await queryRunner.query(`
      CREATE TABLE "core"."grade_categories" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying,
        "updated_by" character varying,
        "name" character varying NOT NULL,
        "description" character varying,
        CONSTRAINT "UQ_grade_categories_name" UNIQUE ("name"),
        CONSTRAINT "PK_grade_categories_id" PRIMARY KEY ("id")
      )
    `);

    // Create grade_levels table
    await queryRunner.query(`
      CREATE TABLE "core"."grade_levels" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying,
        "updated_by" character varying,
        "category_id" UUID NOT NULL,
        "name" character varying NOT NULL,
        "display_order" integer NOT NULL,
        "min_aspect" integer,
        CONSTRAINT "UQ_grade_levels_category_name" UNIQUE ("category_id", "name"),
        CONSTRAINT "PK_grade_levels_id" PRIMARY KEY ("id")
      )
    `);

    // Create jeunes_groups table
    await queryRunner.query(`
      CREATE TABLE "core"."jeunes_groups" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying,
        "updated_by" character varying,
        "name" character varying NOT NULL,
        "min_age" integer NOT NULL,
        "max_age" integer NOT NULL,
        "display_order" integer NOT NULL,
        CONSTRAINT "UQ_jeunes_groups_name" UNIQUE ("name"),
        CONSTRAINT "PK_jeunes_groups_id" PRIMARY KEY ("id")
      )
    `);

    // Create jeunes_members table
    await queryRunner.query(`
      CREATE TABLE "core"."jeunes_members" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying,
        "updated_by" character varying,
        "person_id" UUID NOT NULL,
        "jeunes_group_id" UUID NOT NULL,
        "start_date" date NOT NULL,
        CONSTRAINT "UQ_jeunes_members_person_id" UNIQUE ("person_id"),
        CONSTRAINT "PK_jeunes_members_id" PRIMARY KEY ("id")
      )
    `);

    // Create activity_eligibility_rules table
    await queryRunner.query(`
      CREATE TYPE "core"."activity_eligibility_rules_activitytype_enum" AS ENUM('MONTHLY_MEETING', 'CONFERENCE', 'SERVICE', 'RECREATIONAL', 'SEMAINE', 'JPO')
    `);

    await queryRunner.query(`
      CREATE TABLE "core"."activity_eligibility_rules" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying,
        "updated_by" character varying,
        "activityType" "core"."activity_eligibility_rules_activitytype_enum" NOT NULL,
        "allowed_grade_category" character varying,
        "allowed_grade_level_ids" UUID[],
        "allowed_jeunes_group_ids" UUID[],
        "min_age" integer,
        "max_age" integer,
        CONSTRAINT "PK_activity_eligibility_rules_id" PRIMARY KEY ("id")
      )
    `);

    // Seed grade categories
    await queryRunner.query(`
      INSERT INTO "core"."grade_categories" ("name", "description") VALUES
      ('Membre', 'Member grade'),
      ('Eleve', 'Student grade')
    `);

    // Seed grade levels
    await queryRunner.query(`
      INSERT INTO "core"."grade_levels" ("category_id", "name", "display_order", "min_aspect")
      SELECT id, 'Membre', 1, NULL FROM "core"."grade_categories" WHERE name = 'Membre'
      UNION ALL
      SELECT id, 'Eleve Aspect 1', 2, 1 FROM "core"."grade_categories" WHERE name = 'Eleve'
      UNION ALL
      SELECT id, 'Eleve Aspect 2', 3, 2 FROM "core"."grade_categories" WHERE name = 'Eleve'
    `);

    // Seed jeunes groups
    await queryRunner.query(`
      INSERT INTO "core"."jeunes_groups" ("name", "min_age", "max_age", "display_order") VALUES
      ('preA', 0, 6, 1),
      ('A', 7, 9, 2),
      ('B', 10, 12, 3),
      ('C', 13, 15, 4),
      ('D', 16, 18, 5),
      ('D+', 17, 25, 6)
    `);

    // Add grade_level_id to persons (we'll migrate data later)
    await queryRunner.query(`
      ALTER TABLE "core"."persons" ADD COLUMN "grade_level_id" UUID
    `);

    // Update persons to set grade_level_id based on existing grade_id
    await queryRunner.query(`
      UPDATE "core"."persons" p
      SET "grade_level_id" = gl."id"
      FROM "core"."grade_levels" gl, "core"."grades" g
      WHERE g."id" = p."grade_id" AND gl."name" = g."name"
    `);

    // Make grade_level_id nullable for safety (some persons may not have a grade)
    // Keep the old grade_id column reference - we need to drop the FK first

    // Drop old grade foreign key constraint if it exists
    await queryRunner.query(`
      ALTER TABLE "core"."persons" DROP CONSTRAINT IF EXISTS "FK_persons_grade_id"
    `);

    // Drop old grade column
    await queryRunner.query(`
      ALTER TABLE "core"."persons" DROP COLUMN IF EXISTS "grade_id"
    `);

    // Add foreign key for grade_level_id
    await queryRunner.query(`
      ALTER TABLE "core"."persons" ADD CONSTRAINT "FK_persons_grade_level_id"
      FOREIGN KEY ("grade_level_id") REFERENCES "core"."grade_levels"("id")
    `);

    // Drop old grades table (from migration 1778974563434)
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."grades"`);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_grade_levels_category_id" ON "core"."grade_levels" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_grade_levels_display_order" ON "core"."grade_levels" ("category_id", "display_order")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_jeunes_members_person_id" ON "core"."jeunes_members" ("person_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_jeunes_members_group_id" ON "core"."jeunes_members" ("jeunes_group_id")
    `);

    // Create ActivityScope enum type
    await queryRunner.query(`
      CREATE TYPE "jrs"."activities_scope_enum" AS ENUM('TOWN', 'COUNTRY')
    `);

    // Update JrsActivity table - add new columns
    await queryRunner.query(`
      ALTER TABLE "jrs"."activities" ADD COLUMN IF NOT EXISTS "country_id" UUID,
      ADD COLUMN IF NOT EXISTS "originating_centre_id" UUID,
      ADD COLUMN IF NOT EXISTS "scope" "jrs"."activities_scope_enum" DEFAULT 'TOWN'
    `);

    // Update activities to make town_id nullable
    await queryRunner.query(`
      ALTER TABLE "jrs"."activities" ALTER COLUMN "town_id" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "jrs"."activities" ADD CONSTRAINT "FK_activities_country_id"
      FOREIGN KEY ("country_id") REFERENCES "core"."countries"("id")
    `);

    // Add foreign keys for jeunes_members
    await queryRunner.query(`
      ALTER TABLE "core"."grade_levels" ADD CONSTRAINT "FK_grade_levels_category_id"
      FOREIGN KEY ("category_id") REFERENCES "core"."grade_categories"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "core"."jeunes_members" ADD CONSTRAINT "FK_jeunes_members_person_id"
      FOREIGN KEY ("person_id") REFERENCES "core"."persons"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "core"."jeunes_members" ADD CONSTRAINT "FK_jeunes_members_group_id"
      FOREIGN KEY ("jeunes_group_id") REFERENCES "core"."jeunes_groups"("id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "core"."jeunes_members" DROP CONSTRAINT "FK_jeunes_members_group_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."jeunes_members" DROP CONSTRAINT "FK_jeunes_members_person_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."grade_levels" DROP CONSTRAINT "FK_grade_levels_category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP CONSTRAINT "FK_activities_country_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."persons" DROP CONSTRAINT "FK_persons_grade_level_id"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "core"."IDX_jeunes_members_group_id"`);
    await queryRunner.query(`DROP INDEX "core"."IDX_jeunes_members_person_id"`);
    await queryRunner.query(
      `DROP INDEX "core"."IDX_grade_levels_display_order"`,
    );
    await queryRunner.query(`DROP INDEX "core"."IDX_grade_levels_category_id"`);

    // Remove new columns from activities
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "scope"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "originating_centre_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP COLUMN "country_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ALTER COLUMN "town_id" SET NOT NULL`,
    );

    // Drop enum type
    await queryRunner.query(`DROP TYPE "jrs"."activities_scope_enum"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "core"."activity_eligibility_rules"`);
    await queryRunner.query(
      `DROP TYPE "core"."activity_eligibility_rules_activitytype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "core"."jeunes_members"`);
    await queryRunner.query(`DROP TABLE "core"."jeunes_groups"`);
    await queryRunner.query(`DROP TABLE "core"."grade_levels"`);
    await queryRunner.query(`DROP TABLE "core"."grade_categories"`);

    // Recreate old grades table
    await queryRunner.query(`
      CREATE TABLE "core"."grades" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(50) NOT NULL,
        "description" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_grades_id" PRIMARY KEY ("id")
      )
    `);

    // Restore grade column to persons
    await queryRunner.query(
      `ALTER TABLE "core"."persons" DROP COLUMN "grade_level_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."persons" ADD COLUMN "grade_id" UUID`,
    );
    await queryRunner.query(`
      ALTER TABLE "core"."persons" ADD CONSTRAINT "FK_persons_grade_id"
      FOREIGN KEY ("grade_id") REFERENCES "core"."grades"("id")
    `);
  }
}
