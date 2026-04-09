import { Context, Service } from 'moleculer'
import { FormSchema, FormSchemaVersion } from '../entities'
import { tenantPool } from './tenant-connection-pool'

export interface CreateSchemaParams {
  name: string
  description?: string
  schema: Record<string, any>
}

export interface UpdateSchemaParams {
  id: string
  name?: string
  description?: string
  schema?: Record<string, any>
}

export interface ListSchemaParams {
  page?: number
  pageSize?: number
  status?: string
  search?: string
}

export default class FormSchemaService extends Service {
  public name = 'form-schema'

  actions = {
    /**
     * 创建表单 Schema
     */
    create: {
      rest: 'POST /',
      params: {
        name: 'string',
        description: 'string?',
        schema: 'object'
      },
      handler: async (ctx: Context<CreateSchemaParams>) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const { name, description, schema } = ctx.params

        // 获取租户连接
        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const formSchema = tenantDs.getRepository(FormSchema).create({
            name,
            description,
            schema,
            status: 'draft',
            version: 1,
            tenantId,
            createdBy: userId,
            isPublished: false
          })
          await tenantDs.getRepository(FormSchema).save(formSchema)

          return this.formatSchema(formSchema)
        } finally {
          tenantPool.release(tenantId)
        }
      }
    },

    /**
     * 更新表单 Schema
     */
    update: {
      rest: 'PUT /:id',
      params: {
        id: 'string',
        name: 'string?',
        description: 'string?',
        schema: 'object?'
      },
      handler: async (ctx: Context<UpdateSchemaParams>) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const { id, ...updates } = ctx.params

        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const repo = tenantDs.getRepository(FormSchema)
          const formSchema = await repo.findOne({
            where: { id, tenantId }
          })

          if (!formSchema) {
            throw new Error('Form schema not found')
          }

          // 如果更新了 schema，记录版本
          if (updates.schema) {
            // 创建版本历史
            const version = tenantDs.getRepository(FormSchemaVersion).create({
              schemaId: id,
              version: formSchema.version,
              schema: formSchema.schema,
              createdBy: userId
            })
            await tenantDs.getRepository(FormSchemaVersion).save(version)

            // 更新版本号
            formSchema.version += 1
          }

          // 更新字段
          if (updates.name !== undefined) formSchema.name = updates.name
          if (updates.description !== undefined) formSchema.description = updates.description
          if (updates.schema !== undefined) formSchema.schema = updates.schema

          formSchema.updatedBy = userId
          await repo.save(formSchema)

          return this.formatSchema(formSchema)
        } finally {
          tenantPool.release(tenantId)
        }
      }
    },

    /**
     * 获取表单 Schema 详情
     */
    get: {
      rest: 'GET /:id',
      params: {
        id: 'string'
      },
      handler: async (ctx: Context<{ id: string }>) => {
        const { tenantId } = ctx.meta

        if (!tenantId) {
          throw new Error('Tenant context required')
        }

        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const formSchema = await tenantDs.getRepository(FormSchema).findOne({
            where: { id: ctx.params.id, tenantId }
          })

          if (!formSchema) {
            throw new Error('Form schema not found')
          }

          return this.formatSchema(formSchema)
        } finally {
          tenantPool.release(tenantId)
        }
      }
    },

    /**
     * 列出表单 Schema
     */
    list: {
      rest: 'GET /',
      params: {
        page: 'number?',
        pageSize: 'number?',
        status: 'string?',
        search: 'string?'
      },
      handler: async (ctx: Context<ListSchemaParams>) => {
        const { tenantId } = ctx.meta
        const { page = 1, pageSize = 20, status, search } = ctx.params

        if (!tenantId) {
          throw new Error('Tenant context required')
        }

        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const queryBuilder = tenantDs
            .getRepository(FormSchema)
            .createQueryBuilder('schema')
            .where('schema.tenantId = :tenantId', { tenantId })
            .andWhere('schema.deletedAt IS NULL')

          if (status) {
            queryBuilder.andWhere('schema.status = :status', { status })
          }

          if (search) {
            queryBuilder.andWhere(
              '(schema.name ILIKE :search OR schema.description ILIKE :search)',
              { search: `%${search}%` }
            )
          }

          const [schemas, total] = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .orderBy('schema.updatedAt', 'DESC')
            .getManyAndCount()

          return {
            data: schemas.map((s) => this.formatSchema(s)),
            pagination: {
              page,
              pageSize,
              total,
              totalPages: Math.ceil(total / pageSize)
            }
          }
        } finally {
          tenantPool.release(tenantId)
        }
      }
    },

    /**
     * 删除表单 Schema（软删除）
     */
    delete: {
      rest: 'DELETE /:id',
      params: {
        id: 'string'
      },
      handler: async (ctx: Context<{ id: string }>) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const formSchema = await tenantDs.getRepository(FormSchema).findOne({
            where: { id: ctx.params.id, tenantId }
          })

          if (!formSchema) {
            throw new Error('Form schema not found')
          }

          // 软删除
          formSchema.deletedAt = new Date()
          formSchema.deletedBy = userId
          await tenantDs.getRepository(FormSchema).save(formSchema)

          return { success: true }
        } finally {
          tenantPool.release(tenantId)
        }
      }
    },

    /**
     * 发布表单 Schema
     */
    publish: {
      rest: 'POST /:id/publish',
      params: {
        id: 'string'
      },
      handler: async (ctx: Context<{ id: string }>) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const formSchema = await tenantDs.getRepository(FormSchema).findOne({
            where: { id: ctx.params.id, tenantId }
          })

          if (!formSchema) {
            throw new Error('Form schema not found')
          }

          formSchema.status = 'published'
          formSchema.isPublished = true
          formSchema.publishedAt = new Date()
          formSchema.updatedBy = userId

          await tenantDs.getRepository(FormSchema).save(formSchema)

          return this.formatSchema(formSchema)
        } finally {
          tenantPool.release(tenantId)
        }
      }
    },

    /**
     * 下线表单 Schema
     */
    unpublish: {
      rest: 'POST /:id/unpublish',
      params: {
        id: 'string'
      },
      handler: async (ctx: Context<{ id: string }>) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const formSchema = await tenantDs.getRepository(FormSchema).findOne({
            where: { id: ctx.params.id, tenantId }
          })

          if (!formSchema) {
            throw new Error('Form schema not found')
          }

          formSchema.status = 'draft'
          formSchema.isPublished = false
          formSchema.updatedBy = userId

          await tenantDs.getRepository(FormSchema).save(formSchema)

          return this.formatSchema(formSchema)
        } finally {
          tenantPool.release(tenantId)
        }
      }
    },

    /**
     * 获取版本历史
     */
    versions: {
      rest: 'GET /:id/versions',
      params: {
        id: 'string'
      },
      handler: async (ctx: Context<{ id: string }>) => {
        const { tenantId } = ctx.meta

        if (!tenantId) {
          throw new Error('Tenant context required')
        }

        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const versions = await tenantDs.getRepository(FormSchemaVersion).find({
            where: { schemaId: ctx.params.id },
            order: { version: 'DESC' }
          })

          return {
            data: versions.map((v) => ({
              id: v.id,
              version: v.version,
              changelog: v.changelog,
              createdAt: v.createdAt
            }))
          }
        } finally {
          tenantPool.release(tenantId)
        }
      }
    },

    /**
     * 恢复历史版本
     */
    restoreVersion: {
      rest: 'POST /:id/restore/:version',
      params: {
        id: 'string',
        version: 'number'
      },
      handler: async (ctx: Context<{ id: string; version: number }>) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const versionRecord = await tenantDs.getRepository(FormSchemaVersion).findOne({
            where: { schemaId: ctx.params.id, version: ctx.params.version }
          })

          if (!versionRecord) {
            throw new Error('Version not found')
          }

          // 更新当前版本
          const formSchema = await tenantDs.getRepository(FormSchema).findOne({
            where: { id: ctx.params.id, tenantId }
          })

          if (!formSchema) {
            throw new Error('Form schema not found')
          }

          // 保存当前版本为新版本
          const newVersion = tenantDs.getRepository(FormSchemaVersion).create({
            schemaId: formSchema.id,
            version: formSchema.version,
            schema: formSchema.schema,
            createdBy: userId,
            changelog: `Restored from version ${ctx.params.version}`
          })
          await tenantDs.getRepository(FormSchemaVersion).save(newVersion)

          // 恢复旧版本
          formSchema.schema = versionRecord.schema
          formSchema.version += 1
          formSchema.updatedBy = userId

          await tenantDs.getRepository(FormSchema).save(formSchema)

          return this.formatSchema(formSchema)
        } finally {
          tenantPool.release(tenantId)
        }
      }
    },

    /**
     * 复制表单 Schema
     */
    duplicate: {
      rest: 'POST /:id/duplicate',
      params: {
        id: 'string'
      },
      handler: async (ctx: Context<{ id: string }>) => {
        const { tenantId, userId } = ctx.meta

        if (!tenantId || !userId) {
          throw new Error('Authentication required')
        }

        const tenantDs = await tenantPool.acquire(tenantId)
        try {
          const original = await tenantDs.getRepository(FormSchema).findOne({
            where: { id: ctx.params.id, tenantId }
          })

          if (!original) {
            throw new Error('Form schema not found')
          }

          // 创建副本
          const copy = tenantDs.getRepository(FormSchema).create({
            name: `${original.name} (Copy)`,
            description: original.description,
            schema: original.schema,
            status: 'draft',
            version: 1,
            tenantId,
            createdBy: userId,
            isPublished: false
          })
          await tenantDs.getRepository(FormSchema).save(copy)

          return this.formatSchema(copy)
        } finally {
          tenantPool.release(tenantId)
        }
      }
    }
  }

  /**
   * 格式化返回数据
   */
  private formatSchema(schema: FormSchema) {
    return {
      id: schema.id,
      name: schema.name,
      description: schema.description,
      schema: schema.schema,
      version: schema.version,
      status: schema.status,
      isPublished: schema.isPublished,
      publishedAt: schema.publishedAt,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
      createdBy: schema.createdBy
    }
  }
}
