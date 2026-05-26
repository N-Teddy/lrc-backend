import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonPicturePublicId1778974563433 implements MigrationInterface {
  name = 'AddPersonPicturePublicId1778974563433';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."persons" ADD "picture_public_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."persons" DROP COLUMN "picture_public_id"`,
    );
  }
}
