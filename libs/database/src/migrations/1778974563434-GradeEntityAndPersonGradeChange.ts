import { MigrationInterface, QueryRunner } from 'typeorm';

export class GradeEntityAndPersonGradeChange1778974563434 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create grades table
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

    // Insert predefined grades
    await queryRunner.query(`
            INSERT INTO "core"."grades" ("name", "description", "isActive", "sortOrder") VALUES
            ('Membre', 'Member grade', true, 1),
            ('Eleve Aspect 1', 'Student Aspect 1', true, 2),
            ('Eleve Aspect 2', 'Student Aspect 2', true, 3)
        `);

    // Add grade_id column to persons table
    await queryRunner.query(`
            ALTER TABLE "core"."persons" ADD COLUMN "grade_id" UUID
        `);

    // Update persons to set grade_id based on existing grade string
    await queryRunner.query(`
            UPDATE "core"."persons" p
            SET "grade_id" = g."id"
            FROM "core"."grades" g
            WHERE p."grade" = g."name"
        `);

    // Make grade_id non-nullable (assuming all persons have a grade)
    // But we'll keep it nullable for safety, and the entity already allows null
    // We'll add a foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "core"."persons"
            ADD CONSTRAINT "FK_persons_grade_id"
            FOREIGN KEY ("grade_id") REFERENCES "core"."grades"("id")
        `);

    // Remove the old grade column (string)
    await queryRunner.query(`
            ALTER TABLE "core"."persons" DROP COLUMN "grade"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back the grade column (string)
    await queryRunner.query(`
            ALTER TABLE "core"."persons" ADD COLUMN "grade" character varying(50)
        `);

    // Update persons to set grade string from grades table
    await queryRunner.query(`
            UPDATE "core"."persons" p
            SET "grade" = g."name"
            FROM "core"."grades" g
            WHERE p."grade_id" = g."id"
        `);

    // Drop foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "core"."persons"
            DROP CONSTRAINT "FK_persons_grade_id"
        `);

    // Remove grade_id column
    await queryRunner.query(`
            ALTER TABLE "core"."persons" DROP COLUMN "grade_id"
        `);

    // Drop grades table
    await queryRunner.query(`
            DROP TABLE "core"."grades"
        `);
  }
}
