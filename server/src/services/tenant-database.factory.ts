import { DataSource, EntityTarget } from 'typeorm'
import { FormSchema, FormSchemaVersion, FormSubmission } from '../entities'
import { TenantRole } from '../entities/tenant/TenantRole'
import { TenantUser } from '../entities/tenant/TenantUser'

// 租户数据库实体列表
const TENANT_DB_ENTITIES: EntityTarget<any>[] = [
  TenantUser,
  TenantRole,
  FormSchema,
  FormSchemaVersion,
  FormSubmission
]

export interface TenantDatabaseConfig {
  databaseName: string
  host?: string
  port?: number
  username?: string
  password?: string
}

export class TenantDatabaseFactory {
  private baseConfig: {
    type: 'postgres'
    host: string
    port: number
    username: string
    password: string
    synchronize: boolean
    logging: boolean
  }

  constructor() {
    this.baseConfig = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      synchronize: false,
      logging: false
    }
  }

  /**
   * 创建租户数据库
   */
  async createDatabase(databaseName: string): Promise<void> {
    // 首先连接到 postgres 默认数据库来创建新数据库
    const adminDs = new DataSource({
      ...this.baseConfig,
      database: 'postgres' // 连接到默认数据库
    })

    try {
      await adminDs.initialize()

      // 检查数据库是否已存在
      const result = await adminDs.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
        databaseName
      ])

      if (result.length === 0) {
        // 数据库不存在，创建它
        // 注意：需要使用双引号包裹数据库名，因为数据库名可能包含特殊字符
        await adminDs.query(`CREATE DATABASE "${databaseName}"`)
        console.log(`✅ Created database: ${databaseName}`)
      } else {
        console.log(`Database ${databaseName} already exists`)
      }
    } finally {
      await adminDs.destroy()
    }
  }

  /**
   * 删除租户数据库
   */
  async dropDatabase(databaseName: string): Promise<void> {
    const adminDs = new DataSource({
      ...this.baseConfig,
      database: 'postgres'
    })

    try {
      await adminDs.initialize()
      await adminDs.query(`DROP DATABASE IF EXISTS "${databaseName}"`)
      console.log(`🗑️ Dropped database: ${databaseName}`)
    } finally {
      await adminDs.destroy()
    }
  }

  /**
   * 创建租户数据库连接
   */
  createTenantConnection(databaseName: string): DataSource {
    return new DataSource({
      ...this.baseConfig,
      database: databaseName,
      entities: TENANT_DB_ENTITIES
    })
  }

  /**
   * 初始化租户数据库（创建表结构）
   */
  async initializeTenantDatabase(databaseName: string): Promise<DataSource> {
    const ds = this.createTenantConnection(databaseName)

    try {
      await ds.initialize()

      // 同步表结构 (仅在开发环境，生产环境应使用迁移)
      if (process.env.NODE_ENV !== 'production') {
        await ds.synchronize(true)
      }

      console.log(`✅ Initialized tenant database: ${databaseName}`)
      return ds
    } catch (error) {
      await ds.destroy()
      throw error
    }
  }

  /**
   * 为租户数据库运行迁移
   */
  async runMigrations(databaseName: string): Promise<void> {
    const ds = this.createTenantConnection(databaseName)

    try {
      await ds.initialize()
      await ds.runMigrations()
      console.log(`✅ Ran migrations for: ${databaseName}`)
    } finally {
      await ds.destroy()
    }
  }

  /**
   * 获取所有租户数据库的连接信息
   */
  buildConnectionUrl(databaseName: string): string {
    const { host, port, username, password } = this.baseConfig
    return `postgresql://${username}:${password}@${host}:${port}/${databaseName}`
  }
}

// 单例导出
export const tenantDatabaseFactory = new TenantDatabaseFactory()
