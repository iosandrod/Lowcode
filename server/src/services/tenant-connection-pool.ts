import { DataSource, EntityTarget } from 'typeorm'
import { FormSchema, FormSchemaVersion, FormSubmission } from '../entities'
import { TenantRole, TenantUser } from '../entities/tenant'

// 租户数据库 Entity 列表
const TENANT_ENTITIES: EntityTarget<any>[] = [
  TenantUser,
  TenantRole,
  FormSchema,
  FormSchemaVersion,
  FormSubmission
]

export interface PoolConfig {
  min: number
  max: number
  totalLimit: number
  idleTimeout: number
  acquireTimeout: number
}

interface TenantConnection {
  databaseName: string
  dataSource: DataSource
  lastUsed: number
  inUse: boolean
}

export class TenantConnectionPool {
  private connections = new Map<string, TenantConnection>()
  private config: PoolConfig
  private stats = { total: 0, inUse: 0 }
  private initializing = false
  private initPromise: Promise<void> | null = null

  // 基础数据库配置
  private baseConfig = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    synchronize: false,
    logging: process.env.NODE_ENV === 'development'
  }

  constructor(config: PoolConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    if (this.initializing) {
      return this.initPromise!
    }

    this.initializing = true
    this.initPromise = this.doInitialize()
    return this.initPromise
  }

  private async doInitialize(): Promise<void> {
    // 不需要预热连接，延迟连接
    console.log('TenantConnectionPool initialized')
  }

  /**
   * 获取租户数据库连接
   * @param databaseName 租户数据库名称 (例如: tenant_acme_123)
   */
  async acquire(databaseName: string): Promise<DataSource> {
    // 如果已存在且可用
    const existing = this.connections.get(databaseName)
    if (existing && existing.inUse === false) {
      // 检查连接是否有效
      if (existing.dataSource.isInitialized) {
        existing.inUse = true
        existing.lastUsed = Date.now()
        this.stats.inUse++
        return existing.dataSource
      }
      // 连接已断开，删除重建
      this.connections.delete(databaseName)
      this.stats.total--
    }

    // 检查全局限制
    if (this.stats.total >= this.config.totalLimit) {
      await this.evictOldest()
    }

    // 创建新连接
    const dataSource = await this.createConnection(databaseName)
    this.connections.set(databaseName, {
      databaseName,
      dataSource,
      lastUsed: Date.now(),
      inUse: true
    })
    this.stats.total++
    this.stats.inUse++

    return dataSource
  }

  release(databaseName: string): void {
    const conn = this.connections.get(databaseName)
    if (conn) {
      conn.inUse = false
      conn.lastUsed = Date.now()
      this.stats.inUse--
    }
  }

  private async createConnection(databaseName: string): Promise<DataSource> {
    const ds = new DataSource({
      ...this.baseConfig,
      database: databaseName,
      entities: TENANT_ENTITIES
    })

    await ds.initialize()
    return ds
  }

  private async evictOldest(): Promise<void> {
    let oldest: string | null = null
    let oldestTime = Infinity

    for (const [dbName, conn] of this.connections) {
      if (!conn.inUse && conn.lastUsed < oldestTime) {
        oldestTime = conn.lastUsed
        oldest = dbName
      }
    }

    if (oldest) {
      await this.destroy(oldest)
    }
  }

  async destroy(databaseName: string): Promise<void> {
    const conn = this.connections.get(databaseName)
    if (conn) {
      try {
        if (conn.dataSource.isInitialized) {
          await conn.dataSource.destroy()
        }
      } catch (e) {
        // 忽略销毁错误
      }
      this.connections.delete(databaseName)
      this.stats.total--
      if (conn.inUse) {
        this.stats.inUse--
      }
    }
  }

  async destroyAll(): Promise<void> {
    for (const dbName of this.connections.keys()) {
      await this.destroy(dbName)
    }
  }

  getStats() {
    return {
      ...this.stats,
      tenants: Array.from(this.connections.entries()).map(([dbName, c]) => ({
        databaseName: dbName,
        inUse: c.inUse,
        lastUsed: new Date(c.lastUsed).toISOString()
      }))
    }
  }

  isInitialized(): boolean {
    return this.initializing && this.initPromise !== null
  }
}

// 单例导出
export const tenantPool = new TenantConnectionPool({
  min: 2,
  max: 10,
  totalLimit: 100,
  idleTimeout: 1800000, // 30分钟
  acquireTimeout: 5000
})
