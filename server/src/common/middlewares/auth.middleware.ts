import jwt from 'jsonwebtoken'
import { Context, Service } from 'moleculer'

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

export const AuthMiddleware = {
  name: 'auth-middleware',
  localMiddleware: true,

  async handler(ctx: Context, next: Function) {
    // 跳过公开接口
    const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/verify-token']

    if (publicPaths.some((path) => ctx.path === path)) {
      return next()
    }

    // 提取 token
    const authHeader = ctx.request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: No token')
    }

    const token = authHeader.substring(7)

    try {
      // 验证 token
      const payload = jwt.verify(token, jwtSecret) as {
        tenantId: string
        userId: string
        role: string
      }

      // 设置 meta
      ctx.meta.tenantId = payload.tenantId
      ctx.meta.userId = payload.userId
      ctx.meta.role = payload.role

      await next()
    } catch (err: any) {
      throw new Error(`Unauthorized: ${err.message}`)
    }
  }
}
