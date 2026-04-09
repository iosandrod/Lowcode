import bcrypt from 'bcrypt'
import { Context, Service } from 'moleculer'
import { User } from '../entities'
import { tenantPool } from './tenant-connection-pool'

export interface CreateUserParams {
  email: string
  password: string
  name?: string
  role?: string
}

export interface UpdateUserParams {
  id: string
  email?: string
  name?: string
  role?: string
  status?: string
  avatar?: string
}

export default class UserService extends Service {
  public name = 'user'

  actions = {
    /**
     * 创建用户（仅 admin）
     */
    create: {
      rest: 'POST /',
      params: {
        email: 'string',
        password: 'string',
        name: 'string?',
        role: 'string?'
      },
      handler: async (ctx: Context<CreateUserParams>) => {
        const { tenantId, role: requesterRole } = ctx.meta

        if (!tenantId) {
          throw new Error('Tenant context required')
        }

        // 仅 admin 可创建用户
        if (requesterRole !== 'admin') {
          throw new Error('Admin permission required')
        }

        const { email, password, name, role = 'member' } = ctx.params

        const publicDs = await tenantPool.acquire('public')
        try {
          // 检查邮箱是否已存在
          const existing = await publicDs.getRepository(User).findOne({
            where: { email }
          })
          if (existing) {
            throw new Error('Email already registered')
          }

          // 检查用户配额
          const tenantRepo = publicDs.getRepository('Tenant')
          const tenant = await tenantRepo.findOne({ where: { id: tenantId } })
          if (tenant) {
            const userCount = await publicDs.getRepository(User).count({
              where: { tenantId }
            })
            if (userCount >= (tenant as any).maxUsers) {
              throw new Error('User limit reached')
            }
          }

          // 创建用户
          const hashedPassword = await bcrypt.hash(password, 10)
          const user = publicDs.getRepository(User).create({
            email,
            password: hashedPassword,
            firstName: name,
            role,
            tenantId,
            status: 'active'
          })
          await publicDs.getRepository(User).save(user)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt
          }
        } finally {
          tenantPool.release('public')
        }
      }
    },

    /**
     * 更新用户
     */
    update: {
      rest: 'PUT /:id',
      params: {
        id: 'string',
        email: 'string?',
        name: 'string?',
        role: 'string?',
        status: 'string?',
        avatar: 'string?'
      },
      handler: async (ctx: Context<UpdateUserParams>) => {
        const { tenantId, userId: requesterId, role: requesterRole } = ctx.meta
        const { id } = ctx.params

        if (!tenantId) {
          throw new Error('Tenant context required')
        }

        const publicDs = await tenantPool.acquire('public')
        try {
          const user = await publicDs.getRepository(User).findOne({
            where: { id, tenantId }
          })

          if (!user) {
            throw new Error('User not found')
          }

          // 仅 admin 或本人可更新
          if (requesterRole !== 'admin' && requesterId !== id) {
            throw new Error('Permission denied')
          }

          // 非 admin 不可修改其他用户角色
          if (requesterRole !== 'admin' && ctx.params.role) {
            throw new Error('Admin permission required to change role')
          }

          // 更新字段
          const allowedFields = ['email', 'firstName', 'lastName', 'role', 'status', 'avatar']
          for (const field of allowedFields) {
            const paramKey = field === 'firstName' ? 'name' : field
            if (ctx.params[paramKey] !== undefined) {
              ;(user as any)[field] = ctx.params[paramKey]
            }
          }

          // 如果更新密码
          if (ctx.params.password) {
            ;(user as any).password = await bcrypt.hash(ctx.params.password, 10)
          }

          await publicDs.getRepository(User).save(user)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            avatar: user.avatar
          }
        } finally {
          tenantPool.release('public')
        }
      }
    },

    /**
     * 删除用户
     */
    delete: {
      rest: 'DELETE /:id',
      params: {
        id: 'string'
      },
      handler: async (ctx: Context<{ id: string }>) => {
        const { tenantId, role: requesterRole, userId: requesterId } = ctx.meta
        const { id } = ctx.params

        if (!tenantId) {
          throw new Error('Tenant context required')
        }

        if (requesterRole !== 'admin') {
          throw new Error('Admin permission required')
        }

        // 不可删除自己
        if (requesterId === id) {
          throw new Error('Cannot delete yourself')
        }

        const publicDs = await tenantPool.acquire('public')
        try {
          const user = await publicDs.getRepository(User).findOne({
            where: { id, tenantId }
          })

          if (!user) {
            throw new Error('User not found')
          }

          await publicDs.getRepository(User).remove(user)

          return { success: true }
        } finally {
          tenantPool.release('public')
        }
      }
    },

    /**
     * 获取当前用户信息
     */
    me: {
      rest: 'GET /me',
      handler: async (ctx: Context) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const publicDs = await tenantPool.acquire('public')
        try {
          const user = await publicDs.getRepository(User).findOne({
            where: { id: userId }
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
            lastAccess: user.lastAccess
          }
        } finally {
          tenantPool.release('public')
        }
      }
    },

    /**
     * 更新个人信息（仅本人）
     */
    updateProfile: {
      rest: 'PUT /profile',
      params: {
        name: 'string?',
        avatar: 'string?'
      },
      handler: async (ctx: Context<{ name?: string; avatar?: string }>) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const publicDs = await tenantPool.acquire('public')
        try {
          const user = await publicDs.getRepository(User).findOne({
            where: { id: userId }
          })

          if (!user) {
            throw new Error('User not found')
          }

          if (ctx.params.name !== undefined) {
            user.firstName = ctx.params.name
          }
          if (ctx.params.avatar !== undefined) {
            user.avatar = ctx.params.avatar
          }

          await publicDs.getRepository(User).save(user)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
          }
        } finally {
          tenantPool.release('public')
        }
      }
    },

    /**
     * 修改密码
     */
    changePassword: {
      rest: 'PUT /password',
      params: {
        oldPassword: 'string',
        newPassword: 'string'
      },
      handler: async (ctx: Context<{ oldPassword: string; newPassword: string }>) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const publicDs = await tenantPool.acquire('public')
        try {
          const userRepo = publicDs.getRepository(User)
          const user = await userRepo
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.id = :id', { id: userId })
            .getOne()

          if (!user) {
            throw new Error('User not found')
          }

          // 验证旧密码
          const valid = await bcrypt.compare(ctx.params.oldPassword, user.password || '')
          if (!valid) {
            throw new Error('Invalid old password')
          }

          // 更新密码
          user.password = await bcrypt.hash(ctx.params.newPassword, 10)
          await userRepo.save(user)

          return { success: true }
        } finally {
          tenantPool.release('public')
        }
      }
    }
  }
}
