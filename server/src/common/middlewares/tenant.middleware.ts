import { Context, Service } from 'moleculer'

/**
 * 租户上下文中间件
 *
 * 功能：
 * 1. 从 ctx.meta.tenantId 获取租户 ID
 * 2. 验证租户上下文存在
 * 3. 可扩展：租户配额检查、租户状态验证
 */
export const TenantMiddleware = {
  name: 'tenant-middleware',
  localMiddleware: true,

  async handler(ctx: Context, next: Function) {
    // 公开接口跳过
    const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/verify-token']

    if (publicPaths.some((path) => ctx.path === path)) {
      return next()
    }

    // 检查租户上下文
    const { tenantId, role } = ctx.meta

    if (!tenantId) {
      throw new Error('Tenant context required')
    }

    // 可扩展：检查租户状态、到期时间、配额等
    // const tenant = await ctx.call('tenant.validate', { tenantId })
    // if (!tenant.valid) {
    //   throw new Error(`Tenant ${tenant.status}`)
    // }

    await next()
  }
}
