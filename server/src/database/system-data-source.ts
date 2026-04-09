import { DataSource } from 'typeorm'
import { SystemRole, SystemUser, Tenant } from '../entities/system'

/**
 * System 数据库连接配置
 */
export const systemDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.SYSTEM_DB_NAME || 'system',
  entities: [SystemUser, SystemRole, Tenant],
  synchronize: process.env.NODE_ENV !== 'production', // 生产环境使用迁移
  logging: process.env.NODE_ENV === 'development'
})
