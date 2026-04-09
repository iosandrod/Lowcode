/**
 * Moleculer 配置
 */
import type { BrokerOptions } from 'moleculer'
import { AuthMiddleware } from './common/middlewares/auth.middleware'
import { TenantMiddleware } from './common/middlewares/tenant.middleware'

const config: BrokerOptions = {
  // ============ 节点信息 ============
  namespace: process.env.NAMESPACE || 'development',
  nodeID: process.env.NODE_ID || `node-${process.pid}`,

  // ============ 传输层 ============
  transporter: process.env.TRANSPORTER || 'redis://localhost:6379',

  // ============ 缓存层 ============
  cacher: process.env.CACHER || 'redis://localhost:6379',

  // ============ 请求配置 ============
  requestTimeout: 30 * 1000,
  maxCallLevel: 100,

  // ============ 限流 ============
  rateLimit: {
    enabled: true,
    limit: 100,
    delta: 1000, // 1秒窗口
    protect: true
  },

  // ============ 重试策略 ============
  retryPolicy: {
    enabled: true,
    retries: 3,
    delay: 100,
    maxDelay: 2000
  },

  // ============ 日志 ============
  logLevel: process.env.LOG_LEVEL || 'info',
  logger: true,

  // ============ 集群配置 ============
  registry: {
    strategy: 'RoundRobin',
    options: {
      preferLocal: false
    }
  },

  // ============ 追踪 ============
  tracing: {
    enabled: process.env.NODE_ENV === 'production',
    exporter: 'Console'
  },

  // ============ 服务 ============
  services: [
    './services/auth.service',
    './services/tenant.service',
    './services/user.service',
    './services/form-schema.service'
  ],

  // ============ 中间件 ============
  middlewares: [AuthMiddleware, TenantMiddleware],

  // ============ 生命周期钩子 ============
  async started() {
    console.log('✅ Broker started and ready')
  },

  async stopped() {
    console.log('🛑 Broker stopped')
  }
}

export default config
