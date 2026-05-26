import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1778934051985 implements MigrationInterface {
  name = 'InitialSchema1778934051985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "core"."towns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "name" character varying NOT NULL, "country_id" uuid NOT NULL, CONSTRAINT "UQ_eb01c86a9fdb115697034a4a8b8" UNIQUE ("name", "country_id"), CONSTRAINT "PK_8f5c3dbce1d3ea5de7dcc48c230" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."countries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "name" character varying NOT NULL, "code" character varying NOT NULL, "phone_code" character varying NOT NULL, CONSTRAINT "UQ_fa1376321185575cf2226b1491d" UNIQUE ("name"), CONSTRAINT "UQ_b47cbb5311bad9c9ae17b8c1eda" UNIQUE ("code"), CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."app_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "app_profile_id" uuid NOT NULL, "role_name" character varying NOT NULL, CONSTRAINT "UQ_084525d4e6c5ea2e516938b73be" UNIQUE ("app_profile_id", "role_name"), CONSTRAINT "PK_1dab358fe21b705367e3a7194c0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "core"."app_profiles_app_code_enum" AS ENUM('AUTH', 'ADMIN', 'JRS', 'FINANCE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."app_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "user_id" uuid NOT NULL, "app_code" "core"."app_profiles_app_code_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_e7346aa5fd0827b8af750ebaec3" UNIQUE ("user_id", "app_code"), CONSTRAINT "PK_8aa6ebbe1ff7eedc03daf4dc217" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "person_id" uuid NOT NULL, "password_hash" text, "is_email_verified" boolean NOT NULL DEFAULT false, "is_whatsapp_verified" boolean NOT NULL DEFAULT false, "last_login" TIMESTAMP, "password_reset_token" text, "password_reset_expires" TIMESTAMP WITH TIME ZONE, "is_first_login" boolean NOT NULL DEFAULT true, "invite_token" text, "invite_token_expires" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_5ed72dcd00d6e5a88c6a6ba3d1" UNIQUE ("person_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "core"."persons_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "core"."persons_status_enum" AS ENUM('ALIVE', 'DEAD')`,
    );
    await queryRunner.query(
      `CREATE TABLE "core"."persons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "full_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "gender" "core"."persons_gender_enum" NOT NULL DEFAULT 'OTHER', "date_of_birth" date, "picture" character varying, "status" "core"."persons_status_enum" NOT NULL DEFAULT 'ALIVE', "is_archived" boolean NOT NULL DEFAULT false, "grade" character varying, "town_id" uuid, "country_id" uuid, CONSTRAINT "UQ_928155276ca8852f3c440cc2b2c" UNIQUE ("email"), CONSTRAINT "UQ_6545fa46b808c5870a6b27a3adf" UNIQUE ("phone"), CONSTRAINT "PK_74278d8812a049233ce41440ac7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "notifications"."notifications_type_enum" AS ENUM('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'WELCOME', 'ALERT', 'REMINDER', 'SYSTEM', 'ATTENDANCE_ALERT', 'JRS_MEMBER_CREATED', 'JRS_MEMBER_ARCHIVED', 'JRS_MEMBER_PROMOTED_PC', 'JRS_MEMBER_PROMOTED_AP', 'JRS_MEMBER_DEMOTED_PC', 'JRS_MEMBER_DEMOTED_AP', 'INVITE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notifications"."notifications_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notifications"."notifications_channel_enum" AS ENUM('IN_APP', 'EMAIL', 'WHATSAPP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notifications"."notifications_status_enum" AS ENUM('PENDING', 'SENT', 'FAILED', 'READ', 'DISMISSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications"."notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "recipientId" uuid NOT NULL, "type" "notifications"."notifications_type_enum" NOT NULL, "priority" "notifications"."notifications_priority_enum" NOT NULL DEFAULT 'MEDIUM', "channel" "notifications"."notifications_channel_enum" NOT NULL, "status" "notifications"."notifications_status_enum" NOT NULL DEFAULT 'PENDING', "title" character varying NOT NULL, "body" text NOT NULL, "data" jsonb, "action_url" character varying, "image_url" character varying, "related_entity_id" uuid, "scheduled_at" TIMESTAMP WITH TIME ZONE, "sent_at" TIMESTAMP WITH TIME ZONE, "read_at" TIMESTAMP WITH TIME ZONE, "dismissed_at" TIMESTAMP WITH TIME ZONE, "failure_reason" text, "retry_count" integer NOT NULL DEFAULT '0', "external_id" character varying, "recipient_id" uuid, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_77d2d971c58759c2e2249ce7d0" ON "notifications"."notifications" ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad5fa6719b3f85494d88af4a40" ON "notifications"."notifications" ("recipientId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "logs"."system_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "level" character varying NOT NULL, "message" character varying NOT NULL, "context" character varying, "service" character varying NOT NULL, "metadata" jsonb, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_56861c4b9d16aa90259f4ce0a2c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b29ed915396673611a0f3a46a9" ON "logs"."system_logs" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE TYPE "logs"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'REGISTER', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "logs"."audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "action" "logs"."audit_logs_action_enum" NOT NULL DEFAULT 'OTHER', "entity" character varying NOT NULL, "route" character varying, "method" character varying NOT NULL, "service_name" character varying NOT NULL, "request_body" jsonb, "request_headers" jsonb, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_84223b54cb93213af9fd6e03f0" ON "logs"."audit_logs" ("user_id", "entity") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON "logs"."audit_logs" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "jrs"."members_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'LEFT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "jrs"."members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "person_id" uuid NOT NULL, "join_date" date NOT NULL, "status" "jrs"."members_status_enum" NOT NULL DEFAULT 'ACTIVE', "is_pc" boolean NOT NULL DEFAULT false, "is_ap" boolean NOT NULL DEFAULT false, "has_system_access" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_04270b96d66a1968c4e88442330" UNIQUE ("person_id"), CONSTRAINT "PK_28b53062261b996d9c99fa12404" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "jrs"."activities_activitytype_enum" AS ENUM('MONTHLY_MEETING', 'CONFERENCE', 'SERVICE', 'RECREATIONAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "jrs"."activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "town_id" uuid NOT NULL, "title" character varying NOT NULL, "description" character varying, "activityType" "jrs"."activities_activitytype_enum" NOT NULL, "location" character varying, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE, "is_conference" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "jrs"."attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "activity_id" uuid NOT NULL, "person_id" uuid NOT NULL, "member_id" uuid, CONSTRAINT "UQ_fc1242f02a40fbad2256f9ea97e" UNIQUE ("activity_id", "person_id"), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86687a3aa35d66a5613e23ddd6" ON "jrs"."attendance" ("person_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd0b658e83064c255b73f3dc12" ON "jrs"."attendance" ("activity_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."towns" ADD CONSTRAINT "FK_07f25588697c1460337ff931304" FOREIGN KEY ("country_id") REFERENCES "core"."countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."app_roles" ADD CONSTRAINT "FK_163e4632b446509897eda0d1666" FOREIGN KEY ("app_profile_id") REFERENCES "core"."app_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."app_profiles" ADD CONSTRAINT "FK_7d672b7133c59a0ff0a649c0f02" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."users" ADD CONSTRAINT "FK_5ed72dcd00d6e5a88c6a6ba3d18" FOREIGN KEY ("person_id") REFERENCES "core"."persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."persons" ADD CONSTRAINT "FK_7e4945968d2ab8cae6766733ea6" FOREIGN KEY ("town_id") REFERENCES "core"."towns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."persons" ADD CONSTRAINT "FK_b4a84ca5a0efbd6d25c46e33ae6" FOREIGN KEY ("country_id") REFERENCES "core"."countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications"."notifications" ADD CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d" FOREIGN KEY ("recipient_id") REFERENCES "core"."persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."members" ADD CONSTRAINT "FK_04270b96d66a1968c4e88442330" FOREIGN KEY ("person_id") REFERENCES "core"."persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" ADD CONSTRAINT "FK_61c09ff005087167a7d6c49f989" FOREIGN KEY ("town_id") REFERENCES "core"."towns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."attendance" ADD CONSTRAINT "FK_dd0b658e83064c255b73f3dc12d" FOREIGN KEY ("activity_id") REFERENCES "jrs"."activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."attendance" ADD CONSTRAINT "FK_86687a3aa35d66a5613e23ddd65" FOREIGN KEY ("person_id") REFERENCES "core"."persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."attendance" ADD CONSTRAINT "FK_52d9db0d044b7bcc372147cf5ea" FOREIGN KEY ("member_id") REFERENCES "jrs"."members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jrs"."attendance" DROP CONSTRAINT "FK_52d9db0d044b7bcc372147cf5ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."attendance" DROP CONSTRAINT "FK_86687a3aa35d66a5613e23ddd65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."attendance" DROP CONSTRAINT "FK_dd0b658e83064c255b73f3dc12d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."activities" DROP CONSTRAINT "FK_61c09ff005087167a7d6c49f989"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jrs"."members" DROP CONSTRAINT "FK_04270b96d66a1968c4e88442330"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications"."notifications" DROP CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."persons" DROP CONSTRAINT "FK_b4a84ca5a0efbd6d25c46e33ae6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."persons" DROP CONSTRAINT "FK_7e4945968d2ab8cae6766733ea6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."users" DROP CONSTRAINT "FK_5ed72dcd00d6e5a88c6a6ba3d18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."app_profiles" DROP CONSTRAINT "FK_7d672b7133c59a0ff0a649c0f02"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."app_roles" DROP CONSTRAINT "FK_163e4632b446509897eda0d1666"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."towns" DROP CONSTRAINT "FK_07f25588697c1460337ff931304"`,
    );
    await queryRunner.query(
      `DROP INDEX "jrs"."IDX_dd0b658e83064c255b73f3dc12"`,
    );
    await queryRunner.query(
      `DROP INDEX "jrs"."IDX_86687a3aa35d66a5613e23ddd6"`,
    );
    await queryRunner.query(`DROP TABLE "jrs"."attendance"`);
    await queryRunner.query(`DROP TABLE "jrs"."activities"`);
    await queryRunner.query(`DROP TYPE "jrs"."activities_activitytype_enum"`);
    await queryRunner.query(`DROP TABLE "jrs"."members"`);
    await queryRunner.query(`DROP TYPE "jrs"."members_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "logs"."IDX_2cd10fda8276bb995288acfbfb"`,
    );
    await queryRunner.query(
      `DROP INDEX "logs"."IDX_84223b54cb93213af9fd6e03f0"`,
    );
    await queryRunner.query(`DROP TABLE "logs"."audit_logs"`);
    await queryRunner.query(`DROP TYPE "logs"."audit_logs_action_enum"`);
    await queryRunner.query(
      `DROP INDEX "logs"."IDX_b29ed915396673611a0f3a46a9"`,
    );
    await queryRunner.query(`DROP TABLE "logs"."system_logs"`);
    await queryRunner.query(
      `DROP INDEX "notifications"."IDX_ad5fa6719b3f85494d88af4a40"`,
    );
    await queryRunner.query(
      `DROP INDEX "notifications"."IDX_77d2d971c58759c2e2249ce7d0"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"."notifications"`);
    await queryRunner.query(
      `DROP TYPE "notifications"."notifications_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "notifications"."notifications_channel_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "notifications"."notifications_priority_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "notifications"."notifications_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "core"."persons"`);
    await queryRunner.query(`DROP TYPE "core"."persons_status_enum"`);
    await queryRunner.query(`DROP TYPE "core"."persons_gender_enum"`);
    await queryRunner.query(`DROP TABLE "core"."users"`);
    await queryRunner.query(`DROP TABLE "core"."app_profiles"`);
    await queryRunner.query(`DROP TYPE "core"."app_profiles_app_code_enum"`);
    await queryRunner.query(`DROP TABLE "core"."app_roles"`);
    await queryRunner.query(`DROP TABLE "core"."countries"`);
    await queryRunner.query(`DROP TABLE "core"."towns"`);
  }
}
