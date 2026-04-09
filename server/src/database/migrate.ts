/**
 * 数据库迁移脚本
 * 创建多租户业务表
 */
import 'reflect-metadata'
import { DataSource } from 'typeorm'

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/directus',
  synchronize: false,
  logging: true
})

async function migrate() {
  console.log('🔄 Starting migration...')

  await dataSource.initialize()
  console.log('✅ Database connected')

  const queryRunner = dataSource.createQueryRunner()
  await queryRunner.startTransaction()

  try {
    // ========== 租户表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        logo VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        max_users INT DEFAULT 10,
        max_forms INT DEFAULT 100,
        plan VARCHAR(50),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ Created tenants table')

    // ========== 用户表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        email VARCHAR(128) UNIQUE NOT NULL,
        password VARCHAR(255),
        avatar VARCHAR(255),
        status VARCHAR(16) DEFAULT 'active',
        role VARCHAR(50) DEFAULT 'member',
        permissions JSONB,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        provider VARCHAR(128),
        external_id VARCHAR(255),
        auth_data JSONB,
        token VARCHAR(64),
        token_last_at TIMESTAMPTZ,
        reset_token VARCHAR(64),
        reset_at TIMESTAMPTZ,
        last_access TIMESTAMPTZ,
        last_page VARCHAR(255),
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ Created users table')

    // ========== 租户角色表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL,
        description TEXT,
        icon VARCHAR(64),
        color VARCHAR(32) DEFAULT '#409EFF',
        permissions JSONB,
        parent_id UUID,
        is_system BOOLEAN DEFAULT FALSE,
        admin BOOLEAN DEFAULT FALSE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        sort INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ Created tenant_roles table')

    // ========== 表单 Schema 表 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS form_schemas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        schema JSONB NOT NULL,
        version INT DEFAULT 1,
        is_published BOOLEAN DEFAULT FALSE,
        published_at TIMESTAMPTZ,
        ai_prompt TEXT,
        ai_generated_content TEXT,
        ai_generated_at TIMESTAMPTZ,
        share_token VARCHAR(64),
        allow_share BOOLEAN DEFAULT TRUE,
        tenant_id UUID NOT NULL,
        created_by UUID NOT NULL,
        updated_by UUID,
        deleted_at TIMESTAMPTZ,
        deleted_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ Created form_schemas table')

    // ========== 表单版本历史 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS form_schema_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schema_id UUID NOT NULL REFERENCES form_schemas(id) ON DELETE CASCADE,
        version INT NOT NULL,
        schema JSONB NOT NULL,
        changelog TEXT,
        created_by UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('✅ Created form_schema_versions table')

    // ========== 表单提交记录 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schema_id UUID NOT NULL,
        schema_version INT NOT NULL,
        data JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'submitted',
        submitted_by UUID,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        ip_address VARCHAR(50),
        user_agent TEXT,
        metadata JSONB
      )
    `)
    console.log('✅ Created form_submissions table')

    // ========== 创建索引 ==========
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_form_schemas_tenant_id ON form_schemas(tenant_id)`
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_form_schemas_status ON form_schemas(status)`
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_form_schema_versions_schema_id ON form_schema_versions(schema_id)`
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tenant_roles_tenant_id ON tenant_roles(tenant_id)`
    )
    console.log('✅ Created indexes')

    await queryRunner.commitTransaction()
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    await queryRunner.rollbackTransaction()
    console.error('❌ Migration failed:', error)
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
