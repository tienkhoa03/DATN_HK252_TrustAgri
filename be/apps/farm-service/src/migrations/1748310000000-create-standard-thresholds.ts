import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStandardThresholds1748310000000 implements MigrationInterface {
  name = 'CreateStandardThresholds1748310000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "standard_thresholds" (
        "id"          uuid            NOT NULL DEFAULT gen_random_uuid(),
        "standard_id" uuid            NOT NULL,
        "sensor_type" varchar(32)     NOT NULL,
        "warning_min" double precision,
        "warning_max" double precision,
        "danger_min"  double precision,
        "danger_max"  double precision,
        CONSTRAINT "pk_standard_thresholds" PRIMARY KEY ("id"),
        CONSTRAINT "fk_standard_thresholds_standard"
          FOREIGN KEY ("standard_id") REFERENCES "standards"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_standard_thresholds_std_sensor"
          UNIQUE ("standard_id", "sensor_type")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_standard_thresholds_standard_id"
        ON "standard_thresholds" ("standard_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_standard_thresholds_standard_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "standard_thresholds"`);
  }
}
