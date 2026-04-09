/**
 * System 数据库迁移脚本
 * 创建系统级表：tenants, system_users, system_roles
 */
import 'reflect-metadata'
import { DataSource } from 'typeorm'

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.SYSTEM_DB_NAME || 'system',
  synchronize: false,
  logging: true
})

async function migrate() {
  console.log('🔄 Starting system database migration...')

  await dataSource.initialize()
  console.log('✅ System database connected')

  const queryRunner = dataSource.createQueryRunner()
  await queryRunner.startTransaction()

  try {
    // ========== System Roles 表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS system_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(64),
        color VARCHAR(32) DEFAULT '#409EFF',
        permissions JSONB,
        is_system BOOLEAN DEFAULT FALSE,
        admin BOOLEAN DEFAULT FALSE,
        sort INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ Created system_roles table')

    // ========== System Users 表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS system_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        email VARCHAR(128) UNIQUE NOT NULL,
        password VARCHAR(255),
        avatar VARCHAR(255),
        status VARCHAR(16) DEFAULT 'active',
        role_id UUID REFERENCES system_roles(id) ON DELETE SET NULL,
        permissions JSONB,
        provider VARCHAR(128),
        external_id VARCHAR(255),
        auth_data JSONB,
        token VARCHAR(64),
        token_last_at TIMESTAMPTZ,
        reset_token VARCHAR(64),
        reset_at TIMESTAMPTZ,
        last_access TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ Created system_users table')

    // ========== Tenants 表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        database_name VARCHAR(100) NOT NULL,
        logo VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        max_users INT DEFAULT 10,
        max_forms INT DEFAULT 100,
        plan VARCHAR(50),
        expires_at TIMESTAMPTZ,
        config JSONB,
        domain VARCHAR(255),
        owner_id UUID REFERENCES system_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ Created tenants table')

    // ========== 创建索引 ==========
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email)`
    )
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status)`)
    console.log('✅ Created indexes')

    // ========== 插入默认系统角色 ==========
    await queryRunner.query(`
      INSERT INTO system_roles (name, slug, description, icon, color, permissions, is_system, admin, sort)
      VALUES 
        ('Super Admin', 'superadmin', 'Full access to all system resources', 'mdi-shield-account', '#f44336', 
         '{"tenants": {"create": true, "read": true, "update": true, "delete": true}, "systemUsers": {"create": true, "read": true, "update": true, "delete": true}, "settings": {"read": true, "update": true}}', 
         true, true, 0)
      ON CONFLICT (slug) DO NOTHING
    `)
    console.log('✅ Inserted default superadmin role')

    await queryRunner.query(`
      INSERT INTO system_roles (name, slug, description, icon, color, permissions, is_system, admin, sort)
      VALUES 
        ('Admin', 'admin', 'Tenant administrator', 'mdi-shield', '#409EFF', 
         '{"tenants": {"create": false, "read": true, "update": true, "delete": false}, "settings": {"read": true, "update": true}}', 
         true, false, 1)
      ON CONFLICT (slug) DO NOTHING
    `)
    console.log('✅ Inserted default admin role')

    await queryRunner.commitTransaction()
    console.log('✅ System database migration completed successfully!')
  } catch (error) {
    await queryRunner.rollbackTransaction()
    console.error('❌ System migration failed:', error)
    throw error
  } finally {
    await queryRunner.release()
    await dataSource.destroy()
  }
}

migrate().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
