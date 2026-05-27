import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRolesArray1748304000000 implements MigrationInterface {
  name = 'AddRolesArray1748304000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Add roles column (comma-separated text for TypeORM simple-array)
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roles" text DEFAULT 'buyer'`,
    );
    // Populate from existing role column before dropping it
    await queryRunner.query(
      `UPDATE "users" SET "roles" = role::text`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('farmer', 'trader', 'buyer', 'guest', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "role" "users_role_enum" NOT NULL DEFAULT 'buyer'`,
    );
    // Restore from first value in simple-array (comma-separated)
    await queryRunner.query(
      `UPDATE "users" SET "role" = split_part("roles", ',', 1)::"users_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "roles"`);
  }
}
