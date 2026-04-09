/**
 * Vue Form Craft Backend - 主入口
 */

import { BrokerServer } from 'moleculer'
import AuthService from './services/auth.service'
import FormSchemaService from './services/form-schema.service'
import { tenantPool } from './services/tenant-connection-pool'
import TenantService from './services/tenant.service'
import UserService from './services/user.service'
// 加载环境变量
import 'dotenv/config'

async function main() {
  // 初始化连接池
  console.log('🔌 Initializing database connection pool...')
  await tenantPool.initialize()
  console.log('✅ Database connection pool initialized')

  // 创建 Broker
  const broker = new BrokerServer({
    namespace: process.env.NAMESPACE || 'development',
    nodeID: process.env.NODE_ID || `node-${process.pid}`,

    // 传输层 - Redis
    transporter: process.env.TRANSPORTER || 'redis://localhost:6379',

    // 缓存层 - Redis
    cacher: process.env.CACHER || 'redis://localhost:6379',

    // 请求超时
    requestTimeout: 30 * 1000,

    // 重试策略
    retryPolicy: {
      enabled: true,
      retries: 3,
      delay: 100,
      maxDelay: 2000
    },

    // 限流
    rateLimit: {
      enabled: true,
      limit: 100,
      delta: 1000,
      protect: true
    },

    // 日志
    logLevel: process.env.LOG_LEVEL || 'info',
    logger: true,

    // 注册服务
    services: [AuthService, TenantService, UserService, FormSchemaService],

    // 启动钩子
    async started() {
      console.log('🚀 Broker started')
    },

    async stopped() {
      console.log('🛑 Broker stopped')
      // 关闭所有连接池
      await tenantPool.destroyAll()
      console.log('🔌 All connections closed')
    }
  })

  // 启动 Broker
  await broker.start()

  // 优雅退出
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down...')
    await broker.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down...')
    await broker.stop()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
