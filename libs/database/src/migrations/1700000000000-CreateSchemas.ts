import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchemas1700000000000 implements MigrationInterface {
  name = 'CreateSchemas1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS core`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS logs`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS notifications`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS jrs`);
  }

  // Schemas are never dropped on rollback - use empty arrow function to satisfy interface
  public down = async (): Promise<void> => {};
}
