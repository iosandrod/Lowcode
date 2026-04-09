import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Context, Service } from 'moleculer'
import { systemDataSource } from '../database/system-data-source'
import { SystemRole, SystemUser } from '../entities/system'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface CreateSystemUserParams {
  email: string
  password: string
  name?: string
  roleId?: string
}

export interface LoginParams {
  email: string
  password: string
}

export default class SystemUserService extends Service {
  public name = 'system-user'

  actions = {
    /**
     * 创建系统用户（仅超级管理员可操作）
     */
    create: {
      rest: 'POST /',
      params: {
        email: 'email',
        password: 'string|min:6',
        name: 'string?',
        roleId: 'string?'
      },
      handler: async (ctx: Context<CreateSystemUserParams>) => {
        // 检查是否超级管理员
        if (!ctx.meta.user?.admin) {
          throw new Error('Super admin permission required')
        }

        const { email, password, name, roleId } = ctx.params

        // 检查邮箱是否已存在
        const existing = await systemDataSource.getRepository(SystemUser).findOne({
          where: { email }
        })

        if (existing) {
          throw new Error('Email already registered')
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10)

        // 创建用户
        const user = systemDataSource.getRepository(SystemUser).create({
          email,
          password: hashedPassword,
          firstName: name?.split(' ')[0],
          lastName: name?.split(' ').slice(1).join(' ') || undefined,
          roleId,
          status: 'active'
        })

        await systemDataSource.getRepository(SystemUser).save(user)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        }
      }
    },

    /**
     * 系统用户登录
     */
    login: {
      rest: 'POST /login',
      params: {
        email: 'email',
        password: 'string'
      },
      handler: async (ctx: Context<LoginParams>) => {
        const { email, password } = ctx.params

        // 查找用户
        const user = await systemDataSource.getRepository(SystemUser).findOne({
          where: { email },
          relations: ['role']
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        if (user.status !== 'active') {
          throw new Error('Account is not active')
        }

        // 验证密码
        const valid = await bcrypt.compare(password, user.password || '')
        if (!valid) {
          throw new Error('Invalid credentials')
        }

        // 生成 JWT
        const token = jwt.sign(
          {
            sub: user.id,
            email: user.email,
            role: user.role?.slug || 'user',
            admin: user.admin || user.role?.admin || false
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN } as any
        )

        // 更新 token
        user.token = token
        user.tokenLastAt = new Date()
        await systemDataSource.getRepository(SystemUser).save(user)

        return {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role?.name,
            admin: user.admin || user.role?.admin || false
          }
        }
      }
    },

    /**
     * 验证 token
     */
    verifyToken: {
      rest: 'POST /verify-token',
      handler: async (ctx: Context<{ token: string }>) => {
        try {
          const { token } = ctx.params

          const decoded = jwt.verify(token, JWT_SECRET) as any

          // 验证用户仍然存在且状态正常
          const user = await systemDataSource.getRepository(SystemUser).findOne({
            where: { id: decoded.sub },
            relations: ['role']
          })

          if (!user || user.status !== 'active') {
            throw new Error('User not found or inactive')
          }

          return {
            valid: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role?.name,
              admin: user.admin || user.role?.admin || false
            }
          }
        } catch (error) {
          return {
            valid: false,
            error: (error as Error).message
          }
        }
      }
    },

    /**
     * 获取当前系统用户信息
     */
    me: {
      rest: 'GET /me',
      handler: async (ctx: Context) => {
        const userId = ctx.meta.user?.id

        if (!userId) {
          throw new Error('Authentication required')
        }

        const user = await systemDataSource.getRepository(SystemUser).findOne({
          where: { id: userId },
          relations: ['role']
        })

        if (!user) {
          throw new Error('User not found')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          lastAccess: user.lastAccess,
          createdAt: user.createdAt
        }
      }
    },

    /**
     * 更新系统用户
     */
    update: {
      rest: 'PUT /:id',
      params: {
        name: 'string?',
        avatar: 'string?',
        roleId: 'string?',
        status: 'string?'
      },
      handler: async (ctx: Context<{ id: string } & Partial<SystemUser>>) => {
        // 检查是否超级管理员
        if (!ctx.meta.user?.admin) {
          throw new Error('Super admin permission required')
        }

        const { id } = ctx.params

        const user = await systemDataSource.getRepository(SystemUser).findOne({
          where: { id }
        })

        if (!user) {
          throw new Error('User not found')
        }

        // 更新字段
        const allowedFields = ['firstName', 'lastName', 'avatar', 'roleId', 'status']
        for (const field of allowedFields) {
          if (ctx.params[field] !== undefined) {
            ;(user as any)[field] = ctx.params[field]
          }
        }

        await systemDataSource.getRepository(SystemUser).save(user)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        }
      }
    },

    /**
     * 修改密码
     */
    changePassword: {
      rest: 'PUT /:id/password',
      params: {
        oldPassword: 'string',
        newPassword: 'string|min:6'
      },
      handler: async (ctx: Context<{ id: string; oldPassword: string; newPassword: string }>) => {
        const { id, oldPassword, newPassword } = ctx.params
        const currentUserId = ctx.meta.user?.id

        // 只有本人或超级管理员可以修改
        if (currentUserId !== id && !ctx.meta.user?.admin) {
          throw new Error('Permission denied')
        }

        const user = await systemDataSource.getRepository(SystemUser).findOne({
          where: { id }
        })

        if (!user) {
          throw new Error('User not found')
        }

        // 验证旧密码（本人修改时）
        if (currentUserId === id) {
          const valid = await bcrypt.compare(oldPassword, user.password || '')
          if (!valid) {
            throw new Error('Invalid old password')
          }
        }

        // 设置新密码
        user.password = await bcrypt.hash(newPassword, 10)
        user.resetToken = undefined
        user.resetAt = undefined

        await systemDataSource.getRepository(SystemUser).save(user)

        return { success: true }
      }
    },

    /**
     * 列出系统用户
     */
    list: {
      rest: 'GET /',
      params: {
        page: 'number?',
        pageSize: 'number?',
        search: 'string?'
      },
      handler: async (ctx: Context<{ page?: number; pageSize?: number; search?: string }>) => {
        // 检查是否超级管理员
        if (!ctx.meta.user?.admin) {
          throw new Error('Super admin permission required')
        }

        const { page = 1, pageSize = 20, search } = ctx.params

        const queryBuilder = systemDataSource
          .getRepository(SystemUser)
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.role', 'role')
          .select([
            'user.id',
            'user.email',
            'user.firstName',
            'user.lastName',
            'user.avatar',
            'user.status',
            'user.lastAccess',
            'user.createdAt',
            'role.name',
            'role.slug'
          ])

        if (search) {
          queryBuilder.andWhere(
            '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
            { search: `%${search}%` }
          )
        }

        const [users, total] = await queryBuilder
          .skip((page - 1) * pageSize)
          .take(pageSize)
          .orderBy('user.createdAt', 'DESC')
          .getManyAndCount()

        return {
          data: users.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            avatar: u.avatar,
            role: u.role,
            status: u.status,
            lastAccess: u.lastAccess,
            createdAt: u.createdAt
          })),
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      }
    },

    /**
     * 删除系统用户
     */
    delete: {
      rest: 'DELETE /:id',
      handler: async (ctx: Context<{ id: string }>) => {
        // 检查是否超级管理员
        if (!ctx.meta.user?.admin) {
          throw new Error('Super admin permission required')
        }

        const { id } = ctx.params

        // 不能删除自己
        if (id === ctx.meta.user?.id) {
          throw new Error('Cannot delete yourself')
        }

        const user = await systemDataSource.getRepository(SystemUser).findOne({
          where: { id }
        })

        if (!user) {
          throw new Error('User not found')
        }

        await systemDataSource.getRepository(SystemUser).remove(user)

        return { success: true }
      }
    }
  }
}
