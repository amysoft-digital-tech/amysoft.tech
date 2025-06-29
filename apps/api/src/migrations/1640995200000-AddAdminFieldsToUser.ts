import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminFieldsToUser1640995200000 implements MigrationInterface {
  name = 'AddAdminFieldsToUser1640995200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "isAdmin" boolean NOT NULL DEFAULT false
    `);
    
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "adminRole" varchar
    `);
    
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "lastLogin" timestamp
    `);

    // Create index for admin users for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_users_isAdmin" ON "users" ("isAdmin")
    `);

    // Create index for admin role for role-based queries
    await queryRunner.query(`
      CREATE INDEX "IDX_users_adminRole" ON "users" ("adminRole")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_users_adminRole"
    `);
    
    await queryRunner.query(`
      DROP INDEX "IDX_users_isAdmin"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "lastLogin"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "adminRole"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "isAdmin"
    `);
  }
}