import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Context, Service } from 'moleculer'
import { Tenant, User } from '../entities'
import { tenantPool } from './tenant-connection-pool'

export interface RegisterParams {
  tenantName: string
  tenantSlug: string
  email: string
  password: string
  name?: string
}

export interface LoginParams {
  email: string
  password: string
}

export interface AuthTokenPayload {
  tenantId: string
  userId: string
  role: string
}

export default class AuthService extends Service {
  public name = 'auth'

  // JWT 密钥
  private get jwtSecret(): string {
    return process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  }

  // JWT 过期时间
  private get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '7d'
  }

  actions = {
    /**
     * 注册租户
     */
    register: {
      rest: 'POST /register',
      params: {
        tenantName: 'string',
        tenantSlug: 'string',
        email: 'string',
        password: 'string',
        name: 'string?'
      },
      handler: async (ctx: Context<RegisterParams>) => {
        const { tenantName, tenantSlug, email, password, name } = ctx.params

        // 获取 public 连接
        const publicDs = await tenantPool.acquire('public')

        // 检查租户 slug 是否已存在
        const existingTenant = await publicDs.getRepository(Tenant).findOne({
          where: { slug: tenantSlug }
        })
        if (existingTenant) {
          throw new Error('Tenant slug already exists')
        }

        // 检查邮箱是否已存在
        const existingUser = await publicDs.getRepository(User).findOne({
          where: { email }
        })
        if (existingUser) {
          throw new Error('Email already registered')
        }

        // 创建租户
        const tenant = publicDs.getRepository(Tenant).create({
          name: tenantName,
          slug: tenantSlug,
          status: 'active'
        })
        await publicDs.getRepository(Tenant).save(tenant)

        // 创建租户管理员用户
        const hashedPassword = await bcrypt.hash(password, 10)
        const adminUser = publicDs.getRepository(User).create({
          email,
          password: hashedPassword,
          firstName: name,
          role: 'admin',
          tenantId: tenant.id,
          status: 'active'
        })
        await publicDs.getRepository(User).save(adminUser)

        // 生成 token
        const token = this.generateToken(tenant.id, adminUser.id, 'admin')

        // 释放连接
        tenantPool.release('public')

        return {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug
          },
          user: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name
          },
          token
        }
      }
    },

    /**
     * 登录
     */
    login: {
      rest: 'POST /login',
      params: {
        email: 'string',
        password: 'string'
      },
      handler: async (ctx: Context<LoginParams>) => {
        const { email, password } = ctx.params

        // 获取 public 连接
        const publicDs = await tenantPool.acquire('public')

        // 查找用户（包含 password 字段）
        const userRepo = publicDs.getRepository(User)
        const user = await userRepo
          .createQueryBuilder('user')
          .addSelect('user.password')
          .where('user.email = :email', { email })
          .getOne()

        if (!user) {
          tenantPool.release('public')
          throw new Error('Invalid credentials')
        }

        // 验证密码
        const valid = await bcrypt.compare(password, user.password || '')
        if (!valid) {
          tenantPool.release('public')
          throw new Error('Invalid credentials')
        }

        // 检查用户状态
        if (user.status !== 'active') {
          tenantPool.release('public')
          throw new Error('User account is ' + user.status)
        }

        // 获取租户信息
        const tenant = await publicDs.getRepository(Tenant).findOne({
          where: { id: user.tenantId }
        })

        if (!tenant || tenant.status !== 'active') {
          tenantPool.release('public')
          throw new Error('Tenant account is not active')
        }

        // 更新最后访问时间
        user.lastAccess = new Date()
        await userRepo.save(user)

        // 生成 token
        const token = this.generateToken(user.tenantId, user.id, user.role)

        // 释放连接
        tenantPool.release('public')

        return {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role
          },
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug
          }
        }
      }
    },

    /**
     * 验证 Token
     */
    verifyToken: {
      handler: async (ctx: Context<{ token: string }>) => {
        const { token } = ctx.params
        try {
          const payload = jwt.verify(token, this.jwtSecret) as AuthTokenPayload
          return payload
        } catch (err) {
          throw new Error('Invalid or expired token')
        }
      }
    },

    /**
     * 刷新 Token
     */
    refreshToken: {
      rest: 'POST /refresh-token',
      handler: async (ctx: Context<{ token: string }>) => {
        const { token } = ctx.params
        const payload = jwt.verify(token, this.jwtSecret, {
          ignoreExpiration: true
        }) as AuthTokenPayload

        // 获取 public 连接验证用户仍然有效
        const publicDs = await tenantPool.acquire('public')
        const user = await publicDs.getRepository(User).findOne({
          where: { id: payload.userId }
        })
        tenantPool.release('public')

        if (!user || user.status !== 'active') {
          throw new Error('User no longer valid')
        }

        // 生成新 token
        const newToken = this.generateToken(payload.tenantId, payload.userId, payload.role)

        return { token: newToken }
      }
    }
  }

  /**
   * 生成 JWT Token
   */
  private generateToken(tenantId: string, userId: string, role: string): string {
    return jwt.sign({ tenantId, userId, role }, this.jwtSecret, { expiresIn: this.jwtExpiresIn })
  }
}
