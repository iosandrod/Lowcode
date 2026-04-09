import bcrypt from 'bcrypt'
import { Context, Service } from 'moleculer'
import { systemDataSource } from '../database/system-data-source'
import { FormSchema, FormSubmission } from '../entities'
import { Tenant } from '../entities/system'
import { TenantRole, TenantUser } from '../entities/tenant'
import { tenantPool } from './tenant-connection-pool'
import { tenantDatabaseFactory } from './tenant-database.factory'

export interface CreateTenantParams {
  name: string
  slug: string
  ownerEmail: string
  ownerPassword: string
  ownerName?: string
  plan?: string
  maxUsers?: number
  maxForms?: number
}

export default class TenantService extends Service {
  public name = 'tenant'

  actions = {
    /**
     * 创建新租户（包含独立数据库）
     */
    create: {
      rest: 'POST /',
      params: {
        name: 'string',
        slug: 'string',
        ownerEmail: 'email',
        ownerPassword: 'string|min:6',
        ownerName: 'string?',
        plan: 'string?',
        maxUsers: 'number?',
        maxForms: 'number?'
      },
      handler: async (ctx: Context<CreateTenantParams>) => {
        const {
          name,
          slug,
          ownerEmail,
          ownerPassword,
          ownerName,
          plan,
          maxUsers = 10,
          maxForms = 100
        } = ctx.params

        // 1. 检查 slug 是否已存在
        const existingTenant = await systemDataSource.getRepository(Tenant).findOne({
          where: { slug }
        })

        if (existingTenant) {
          throw new Error('Tenant slug already exists')
        }

        // 2. 生成数据库名称
        const databaseName = `tenant_${slug}`

        // 3. 创建租户独立数据库
        try {
          await tenantDatabaseFactory.createDatabase(databaseName)
        } catch (error) {
          throw new Error(`Failed to create database: ${error}`)
        }

        // 4. 初始化租户数据库（创建表结构）
        const tenantDs = await tenantDatabaseFactory.initializeTenantDatabase(databaseName)

        try {
          // 5. 创建租户管理员角色
          const adminRole = tenantDs.getRepository(TenantRole).create({
            name: 'Administrator',
            slug: 'admin',
            description: 'Full access to all tenant resources',
            icon: 'mdi-shield-account',
            color: '#f44336',
            isSystem: true,
            admin: true,
            permissions: {
              formSchemas: { create: true, read: true, update: true, delete: true },
              submissions: { create: true, read: true, update: true, delete: true },
              users: { create: true, read: true, update: true, delete: true },
              settings: { read: true, update: true }
            }
          })
          await tenantDs.getRepository(TenantRole).save(adminRole)

          // 6. 创建默认角色
          const memberRole = tenantDs.getRepository(TenantRole).create({
            name: 'Member',
            slug: 'member',
            description: 'Basic access to forms',
            icon: 'mdi-account',
            color: '#409EFF',
            isSystem: true,
            admin: false,
            permissions: {
              formSchemas: { create: true, read: true, update: false, delete: false },
              submissions: { create: true, read: true, update: false, delete: false },
              users: { create: false, read: false, update: false, delete: false },
              settings: { read: true, update: false }
            }
          })
          await tenantDs.getRepository(TenantRole).save(memberRole)

          const viewerRole = tenantDs.getRepository(TenantRole).create({
            name: 'Viewer',
            slug: 'viewer',
            description: 'Read-only access',
            icon: 'mdi-eye',
            color: '#67c23a',
            isSystem: true,
            admin: false,
            permissions: {
              formSchemas: { create: false, read: true, update: false, delete: false },
              submissions: { create: false, read: true, update: false, delete: false },
              users: { create: false, read: false, update: false, delete: false },
              settings: { read: true, update: false }
            }
          })
          await tenantDs.getRepository(TenantRole).save(viewerRole)

          // 7. 创建租户管理员用户
          const hashedPassword = await bcrypt.hash(ownerPassword, 10)
          const adminUser = tenantDs.getRepository(TenantUser).create({
            email: ownerEmail,
            password: hashedPassword,
            firstName: ownerName?.split(' ')[0] || ownerName,
            lastName: ownerName?.split(' ').slice(1).join(' ') || undefined,
            role: 'admin',
            status: 'active',
            createdBy: undefined // 第一个用户
          })
          await tenantDs.getRepository(TenantUser).save(adminUser)

          // 8. 将租户信息写入 system 数据库
          const systemTenant = systemDataSource.getRepository(Tenant).create({
            name,
            slug,
            databaseName,
            ownerId: adminUser.id,
            plan: plan || 'trial',
            maxUsers,
            maxForms,
            status: 'active'
          })
          await systemDataSource.getRepository(Tenant).save(systemTenant)

          return {
            id: systemTenant.id,
            name: systemTenant.name,
            slug: systemTenant.slug,
            databaseName,
            plan: systemTenant.plan,
            status: systemTenant.status,
            owner: {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name
            }
          }
        } finally {
          await tenantDs.destroy()
        }
      }
    },

    /**
     * 获取租户信息（system 数据库）
     */
    get: {
      rest: 'GET /:slug',
      handler: async (ctx: Context<{ slug: string }>) => {
        const { slug } = ctx.params

        const tenant = await systemDataSource.getRepository(Tenant).findOne({
          where: { slug }
        })

        if (!tenant) {
          throw new Error('Tenant not found')
        }

        return tenant
      }
    },

    /**
     * 获取当前租户信息
     */
    me: {
      rest: 'GET /me',
      handler: async (ctx: Context) => {
        const { tenantSlug } = ctx.meta

        if (!tenantSlug) {
          throw new Error('Tenant context required')
        }

        const tenant = await systemDataSource.getRepository(Tenant).findOne({
          where: { slug: tenantSlug }
        })

        if (!tenant) {
          throw new Error('Tenant not found')
        }

        // 连接租户数据库获取用户数量
        const tenantDs = await tenantPool.acquire(tenant.databaseName)
        try {
          const userCount = await tenantDs.getRepository(TenantUser).count()

          return {
            ...tenant,
            userCount
          }
        } finally {
          tenantPool.release(tenant.databaseName)
        }
      }
    },

    /**
     * 更新租户信息
     */
    update: {
      rest: 'PUT /',
      params: {
        name: 'string?',
        logo: 'string?',
        maxUsers: 'number?',
        maxForms: 'number?',
        plan: 'string?',
        status: 'string?'
      },
      handler: async (ctx: Context<Partial<Tenant>>) => {
        const { tenantSlug } = ctx.meta

        if (!tenantSlug) {
          throw new Error('Tenant context required')
        }

        // 仅 admin 可更新
        if (ctx.meta.role !== 'admin') {
          throw new Error('Admin permission required')
        }

        const tenant = await systemDataSource.getRepository(Tenant).findOne({
          where: { slug: tenantSlug }
        })

        if (!tenant) {
          throw new Error('Tenant not found')
        }

        // 更新字段
        const allowedFields = ['name', 'logo', 'maxUsers', 'maxForms', 'plan', 'status']
        for (const field of allowedFields) {
          if (ctx.params[field] !== undefined) {
            ;(tenant as any)[field] = ctx.params[field]
          }
        }

        await systemDataSource.getRepository(Tenant).save(tenant)

        return tenant
      }
    },

    /**
     * 获取租户下的用户列表（从租户数据库）
     */
    users: {
      rest: 'GET /users',
      params: {
        page: 'number?',
        pageSize: 'number?',
        search: 'string?'
      },
      handler: async (ctx: Context<{ page?: number; pageSize?: number; search?: string }>) => {
        const { tenantSlug } = ctx.meta
        const { page = 1, pageSize = 20, search } = ctx.params

        if (!tenantSlug) {
          throw new Error('Tenant context required')
        }

        const tenant = await systemDataSource.getRepository(Tenant).findOne({
          where: { slug: tenantSlug }
        })

        if (!tenant) {
          throw new Error('Tenant not found')
        }

        const tenantDs = await tenantPool.acquire(tenant.databaseName)
        try {
          const queryBuilder = tenantDs
            .getRepository(TenantUser)
            .createQueryBuilder('user')
            .select([
              'user.id',
              'user.email',
              'user.firstName',
              'user.lastName',
              'user.avatar',
              'user.role',
              'user.status',
              'user.lastAccess',
              'user.createdAt'
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
            data: users,
            pagination: {
              page,
              pageSize,
              total,
              totalPages: Math.ceil(total / pageSize)
            }
          }
        } finally {
          tenantPool.release(tenant.databaseName)
        }
      }
    },

    /**
     * 获取租户统计
     */
    stats: {
      rest: 'GET /stats',
      handler: async (ctx: Context) => {
        const { tenantSlug } = ctx.meta

        if (!tenantSlug) {
          throw new Error('Tenant context required')
        }

        const tenant = await systemDataSource.getRepository(Tenant).findOne({
          where: { slug: tenantSlug }
        })

        if (!tenant) {
          throw new Error('Tenant not found')
        }

        const tenantDs = await tenantPool.acquire(tenant.databaseName)
        try {
          const userCount = await tenantDs.getRepository(TenantUser).count()
          const formCount = await tenantDs.getRepository(FormSchema).count()
          const submissionCount = await tenantDs.getRepository(FormSubmission).count()

          return {
            userCount,
            formCount,
            submissionCount,
            plan: tenant.plan,
            maxUsers: tenant.maxUsers,
            maxForms: tenant.maxForms
          }
        } finally {
          tenantPool.release(tenant.databaseName)
        }
      }
    },

    /**
     * 删除租户（谨慎操作）
     */
    delete: {
      rest: 'DELETE /',
      handler: async (ctx: Context) => {
        const { tenantSlug } = ctx.meta

        if (!tenantSlug) {
          throw new Error('Tenant context required')
        }

        // 仅 admin 可删除
        if (ctx.meta.role !== 'admin') {
          throw new Error('Admin permission required')
        }

        const tenant = await systemDataSource.getRepository(Tenant).findOne({
          where: { slug: tenantSlug }
        })

        if (!tenant) {
          throw new Error('Tenant not found')
        }

        // 1. 删除租户数据库
        try {
          await tenantDatabaseFactory.dropDatabase(tenant.databaseName)
        } catch (error) {
          console.error(`Failed to drop tenant database: ${error}`)
        }

        // 2. 删除 system 数据库中的租户记录
        await systemDataSource.getRepository(Tenant).remove(tenant)

        return { success: true }
      }
    }
  }
}
