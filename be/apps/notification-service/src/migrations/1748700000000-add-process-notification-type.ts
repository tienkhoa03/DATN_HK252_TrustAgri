import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcessNotificationType1748700000000 implements MigrationInterface {
  name = 'AddProcessNotificationType1748700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old CHECK constraint on type column (find by name pattern, safe if not exists)
    await queryRunner.query(`
      DO $$
      DECLARE
        cname TEXT;
      BEGIN
        SELECT c.conname INTO cname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'notifications'
          AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) LIKE '%alert%'
          AND pg_get_constraintdef(c.oid) LIKE '%system%'
          AND pg_get_constraintdef(c.oid) NOT LIKE '%process%';

        IF cname IS NOT NULL THEN
          EXECUTE format('ALTER TABLE notifications DROP CONSTRAINT %I', cname);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
        ADD CONSTRAINT "chk_notifications_type"
        CHECK ("type" IN ('alert', 'contract', 'connection', 'system', 'process'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "chk_notifications_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
        ADD CONSTRAINT "chk_notifications_type_v1"
        CHECK ("type" IN ('alert', 'contract', 'connection', 'system'))
    `);
  }
}
