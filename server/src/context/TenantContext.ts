/**
 * Tenant Context - 多租户上下文
 *
 * 参考 Directus 的 Accountability + Service 模式
 * 提供：
 * - 租户信息
 * - 用户信息
 * - 权限校验（从数据库动态读取）
 * - 数据库 CRUD 操作
 * - 文件操作
 */

import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import bcrypt from 'bcrypt'
import { DataSource } from 'typeorm'
import { systemDataSource } from '../database/system-data-source'
import { FormSchema, FormSchemaVersion, FormSubmission } from '../entities'
import { Tenant } from '../entities/system'
import { TenantRole, TenantUser } from '../entities/tenant'
import { tenantPool } from '../services/tenant-connection-pool'

// ============ 类型定义 ============

export interface Accountability {
  userId: string | null
  tenantId: string | null
  role: string | null
  permissions: RolePermissions
  ip: string | null
}

export interface RolePermissions {
  formSchemas?: CRUDPermissions
  submissions?: CRUDPermissions
  users?: CRUDPermissions
  files?: CRUDPermissions
  settings?: { read?: boolean; update?: boolean }
  admin?: boolean
}

export interface CRUDPermissions {
  create?: boolean
  read?: boolean
  update?: boolean
  delete?: boolean
}

export interface QueryOptions {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  order?: 'ASC' | 'DESC'
  filter?: Record<string, any>
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CRUDResult<T> {
  data: T | T[] | null
  success: boolean
  message?: string
}

export interface FileUploadResult {
  id: string
  filename: string
  url: string
  size: number
  mimeType: string
}

// ============ 实体映射 ============

type EntityClass = {
  new (...args: any[]): any
}

const TENANT_ENTITIES: Record<string, EntityClass> = {
  formSchemas: FormSchema,
  formSubmissions: FormSubmission
}

const PUBLIC_ENTITIES: Record<string, EntityClass> = {
  users: TenantUser,
  tenantRoles: TenantRole,
  tenants: Tenant
}

// ============ TenantContext 类 ============

export class TenantContext {
  public accountability: Accountability
  public knex: DataSource
  public user: TenantUser | null = null
  public tenant: Tenant | null = null

  constructor(
    public tenantId: string,
    public userId: string,
    public dataSource: DataSource,
    accountability?: Partial<Accountability>
  ) {
    this.knex = dataSource
    this.accountability = {
      userId: userId,
      tenantId: tenantId,
      role: accountability?.role || null,
      permissions: accountability?.permissions || {},
      ip: accountability?.ip || null
    }
  }

  // ============ 工厂方法 ============

  /**
   * 从 ctx.meta 创建 Context（用于 Moleculer）
   * 权限从数据库动态读取
   */
  static async fromMeta(
    meta: { tenantId: string; userId: string; role?: string; ip?: string },
    pool = tenantPool
  ): Promise<TenantContext> {
    const ds = await pool.acquire(meta.tenantId)
    const publicDs = await pool.acquire('public')

    try {
      // 1. 获取用户信息
      const userRepo = publicDs.getRepository(User)
      const user = await userRepo.findOne({
        where: { id: meta.userId },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'role',
          'permissions',
          'avatar',
          'status',
          'tenantId'
        ]
      })

      if (!user) {
        throw new Error('User not found')
      }

      // 2. 动态加载权限（从角色和用户两个级别）
      const permissions = await TenantContext.loadPermissions(
        publicDs,
        meta.tenantId,
        user.role,
        user.permissions
      )

      // 3. 获取租户信息
      const tenantRepo = publicDs.getRepository(Tenant)
      const tenant = await tenantRepo.findOne({
        where: { id: meta.tenantId },
        select: ['id', 'name', 'slug', 'status', 'maxUsers', 'maxForms', 'plan']
      })

      // 创建 Context
      const ctx = new TenantContext(meta.tenantId, meta.userId, ds, {
        role: user.role,
        permissions,
        ip: meta.ip || null
      })

      ctx.user = user
      ctx.tenant = tenant

      return ctx
    } finally {
      pool.release('public')
    }
  }

  /**
   * 从数据库动态加载权限
   * 1. 先查 TenantRole 获取角色默认权限
   * 2. 再用用户的 permissions 覆盖（如果有）
   */
  static async loadPermissions(
    publicDs: DataSource,
    tenantId: string,
    roleSlug: string | undefined,
    userPermissions?: Record<string, any>
  ): Promise<RolePermissions> {
    // 默认权限
    const defaultPermissions: RolePermissions = {}

    if (!roleSlug) {
      return defaultPermissions
    }

    // 1. 查询角色权限
    const roleRepo = publicDs.getRepository(TenantRole)
    const role = await roleRepo.findOne({
      where: { slug: roleSlug, tenantId },
      select: ['permissions', 'isSystem', 'admin']
    })

    if (role) {
      // 如果是系统管理员角色，拥有所有权限
      if (role.isSystem || role.admin) {
        return {
          admin: true,
          formSchemas: { create: true, read: true, update: true, delete: true },
          submissions: { create: true, read: true, update: true, delete: true },
          users: { create: true, read: true, update: true, delete: true },
          files: { create: true, read: true, update: true, delete: true },
          settings: { read: true, update: true }
        }
      }

      // 使用角色配置的权限
      if (role.permissions) {
        Object.assign(defaultPermissions, role.permissions)
      }
    }

    // 2. 用户级别权限覆盖
    if (userPermissions) {
      // 深度合并用户权限覆盖
      TenantContext.mergePermissions(defaultPermissions, userPermissions)
    }

    return defaultPermissions
  }

  /**
   * 深度合并权限配置
   * 用户权限可以覆盖角色权限
   */
  static mergePermissions(base: RolePermissions, override: Record<string, any>, path = ''): void {
    for (const key in override) {
      const value = override[key]
      const currentPath = path ? `${path}.${key}` : key

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (!base[key as keyof RolePermissions]) {
          ;(base as any)[key] = {}
        }
        TenantContext.mergePermissions(
          base[key as keyof RolePermissions] as any,
          value,
          currentPath
        )
      } else {
        // 布尔值直接覆盖
        ;(base as any)[key] = value
      }
    }
  }

  // ============ 权限校验 ============

  /**
   * 检查是否有权限
   */
  hasPermission(
    resource: 'formSchemas' | 'submissions' | 'users' | 'files' | 'settings',
    action: 'create' | 'read' | 'update' | 'delete'
  ): boolean {
    // Admin 拥有所有权限
    if (this.accountability.permissions.admin) return true

    const resourcePerm = this.accountability.permissions[resource]
    if (!resourcePerm) return false

    return resourcePerm[action] === true
  }

  /**
   * 强制权限校验
   */
  requirePermission(
    resource: 'formSchemas' | 'submissions' | 'users' | 'files' | 'settings',
    action: 'create' | 'read' | 'update' | 'delete'
  ): void {
    if (!this.hasPermission(resource, action)) {
      throw new Error(`Permission denied: ${action} ${resource}`)
    }
  }

  // ============ 租户信息 ============

  /**
   * 获取当前租户信息
   */
  async getTenant(): Promise<Tenant | null> {
    if (this.tenant) return this.tenant

    const publicDs = await tenantPool.acquire('public')
    try {
      const repo = publicDs.getRepository(Tenant)
      return await repo.findOne({ where: { id: this.tenantId } })
    } finally {
      tenantPool.release('public')
    }
  }

  /**
   * 获取当前用户信息
   */
  async getUser(): Promise<User | null> {
    if (this.user) return this.user

    const publicDs = await tenantPool.acquire('public')
    try {
      const repo = publicDs.getRepository(User)
      return await repo.findOne({ where: { id: this.userId } })
    } finally {
      tenantPool.release('public')
    }
  }

  // ============ 权限管理（Admin 专用）============

  /**
   * 获取所有角色
   */
  async listRoles(): Promise<TenantRole[]> {
    this.requirePermission('users', 'read')

    const publicDs = await tenantPool.acquire('public')
    try {
      const repo = publicDs.getRepository(TenantRole)
      return await repo.find({
        where: { tenantId: this.tenantId },
        order: { sort: 'ASC' }
      })
    } finally {
      tenantPool.release('public')
    }
  }

  /**
   * 创建角色
   */
  async createRole(data: {
    name: string
    slug: string
    description?: string
    permissions?: RolePermissions
    isSystem?: boolean
  }): Promise<TenantRole> {
    this.requirePermission('users', 'create')

    const publicDs = await tenantPool.acquire('public')
    try {
      const repo = publicDs.getRepository(TenantRole)
      const role = repo.create({
        ...data,
        tenantId: this.tenantId
      })
      return await repo.save(role)
    } finally {
      tenantPool.release('public')
    }
  }

  /**
   * 更新角色
   */
  async updateRole(id: string, data: Partial<TenantRole>): Promise<TenantRole | null> {
    this.requirePermission('users', 'update')

    const publicDs = await tenantPool.acquire('public')
    try {
      const repo = publicDs.getRepository(TenantRole)
      const role = await repo.findOne({ where: { id, tenantId: this.tenantId } })

      if (!role) return null
      if (role.isSystem) {
        throw new Error('Cannot modify system role')
      }

      Object.assign(role, data)
      return await repo.save(role)
    } finally {
      tenantPool.release('public')
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(id: string): Promise<boolean> {
    this.requirePermission('users', 'delete')

    const publicDs = await tenantPool.acquire('public')
    try {
      const repo = publicDs.getRepository(TenantRole)
      const role = await repo.findOne({ where: { id, tenantId: this.tenantId } })

      if (!role) return false
      if (role.isSystem) {
        throw new Error('Cannot delete system role')
      }

      // 检查是否有用户使用此角色
      const userCount = await publicDs.getRepository(User).count({
        where: { role: role.slug, tenantId: this.tenantId }
      })

      if (userCount > 0) {
        throw new Error(`Cannot delete role: ${userCount} users are using it`)
      }

      await repo.remove(role)
      return true
    } finally {
      tenantPool.release('public')
    }
  }

  /**
   * 刷新用户权限（从数据库重新加载）
   */
  async refreshPermissions(): Promise<void> {
    const publicDs = await tenantPool.acquire('public')
    try {
      const userRepo = publicDs.getRepository(User)
      const user = await userRepo.findOne({
        where: { id: this.userId },
        select: ['role', 'permissions']
      })

      if (user) {
        this.accountability.permissions = await TenantContext.loadPermissions(
          publicDs,
          this.tenantId,
          user.role,
          user.permissions
        )
        this.accountability.role = user.role
        this.user = user as User
      }
    } finally {
      tenantPool.release('public')
    }
  }

  /**
   * 更新用户权限覆盖
   */
  async updateUserPermissions(userId: string, permissions: Record<string, any>): Promise<boolean> {
    // 只能 admin 或本人修改自己
    if (userId !== this.userId && !this.accountability.permissions.admin) {
      throw new Error('Permission denied')
    }

    const publicDs = await tenantPool.acquire('public')
    try {
      const userRepo = publicDs.getRepository(User)
      const user = await userRepo.findOne({
        where: { id: userId, tenantId: this.tenantId }
      })

      if (!user) return false

      user.permissions = permissions
      await userRepo.save(user)

      // 如果是本人，更新当前上下文
      if (userId === this.userId) {
        await this.refreshPermissions()
      }

      return true
    } finally {
      tenantPool.release('public')
    }
  }

  // ============ 通用 CRUD（租户实体）============

  async create<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    data: Record<string, any>
  ): Promise<CRUDResult<any>> {
    try {
      this.requirePermission(entity as any, 'create')

      const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
      const instance = repo.create({
        ...data,
        tenantId: this.tenantId,
        createdBy: this.userId
      })
      const result = await repo.save(instance)
      return { data: result, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async read<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    id: string
  ): Promise<CRUDResult<any>> {
    try {
      this.requirePermission(entity as any, 'read')

      const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
      const result = await repo.findOne({ where: { id, tenantId: this.tenantId } })
      return { data: result, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async list<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    options: QueryOptions = {}
  ): Promise<PaginationResult<any>> {
    this.requirePermission(entity as any, 'read')

    const { page = 1, pageSize = 20, search, sort = 'createdAt', order = 'DESC', filter } = options

    const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
    const queryBuilder = repo
      .createQueryBuilder('entity')
      .where('entity.tenantId = :tenantId', { tenantId: this.tenantId })

    // 软删除过滤
    if ('deletedAt' in repo.metadata.propertiesMap) {
      queryBuilder.andWhere('entity.deletedAt IS NULL')
    }

    if (search) {
      queryBuilder.andWhere('(entity.name ILIKE :search OR entity.description ILIKE :search)', {
        search: `%${search}%`
      })
    }

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value })
      })
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(`entity.${sort}`, order)
      .getManyAndCount()

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    }
  }

  async update<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    id: string,
    data: Record<string, any>
  ): Promise<CRUDResult<any>> {
    try {
      this.requirePermission(entity as any, 'update')

      const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
      const instance = await repo.findOne({ where: { id, tenantId: this.tenantId } })

      if (!instance) {
        return { data: null, success: false, message: 'Not found' }
      }

      Object.assign(instance, data, { updatedBy: this.userId })
      const result = await repo.save(instance)
      return { data: result, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async delete<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    id: string
  ): Promise<CRUDResult<boolean>> {
    try {
      this.requirePermission(entity as any, 'delete')

      const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
      const instance = await repo.findOne({ where: { id, tenantId: this.tenantId } })

      if (!instance) {
        return { data: false, success: false, message: 'Not found' }
      }

      if ('deletedAt' in repo.metadata.propertiesMap) {
        ;(instance as any).deletedAt = new Date()
        ;(instance as any).deletedBy = this.userId
        await repo.save(instance)
      } else {
        await repo.remove(instance)
      }

      return { data: true, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  // ============ 批量操作 ============

  async createMany<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    data: Record<string, any>[]
  ): Promise<CRUDResult<any[]>> {
    try {
      this.requirePermission(entity as any, 'create')

      const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
      const instances = data.map((item) =>
        repo.create({ ...item, tenantId: this.tenantId, createdBy: this.userId })
      )
      const result = await repo.save(instances)
      return { data: result, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async updateMany<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    ids: string[],
    data: Record<string, any>
  ): Promise<CRUDResult<number>> {
    try {
      this.requirePermission(entity as any, 'update')

      const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
      const result = await repo.update(
        { id: ids as any, tenantId: this.tenantId } as any,
        { ...data, updatedBy: this.userId } as any
      )
      return { data: result.affected || 0, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async deleteMany<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    ids: string[]
  ): Promise<CRUDResult<number>> {
    try {
      this.requirePermission(entity as any, 'delete')

      const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
      const result = await repo.update(
        { id: ids as any, tenantId: this.tenantId } as any,
        { deletedAt: new Date(), deletedBy: this.userId } as any
      )
      return { data: result.affected || 0, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  // ============ 公共实体 CRUD ============

  async createPublic<T extends keyof typeof PUBLIC_ENTITIES>(
    entity: T,
    data: Record<string, any>
  ): Promise<CRUDResult<any>> {
    try {
      if (entity === 'users') {
        this.requirePermission('users', 'create')
      }

      const publicDs = await tenantPool.acquire('public')
      try {
        const repo = publicDs.getRepository(PUBLIC_ENTITIES[entity])
        const instance = repo.create({ ...data, tenantId: this.tenantId })
        const result = await repo.save(instance)
        return { data: result, success: true }
      } finally {
        tenantPool.release('public')
      }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async readPublic<T extends keyof typeof PUBLIC_ENTITIES>(
    entity: T,
    id: string
  ): Promise<CRUDResult<any>> {
    try {
      if (entity === 'users') {
        this.requirePermission('users', 'read')
      }

      const publicDs = await tenantPool.acquire('public')
      try {
        const repo = publicDs.getRepository(PUBLIC_ENTITIES[entity])
        const result = await repo.findOne({ where: { id, tenantId: this.tenantId } })
        return { data: result, success: true }
      } finally {
        tenantPool.release('public')
      }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async listPublic<T extends keyof typeof PUBLIC_ENTITIES>(
    entity: T,
    options: QueryOptions = {}
  ): Promise<PaginationResult<any>> {
    if (entity === 'users') {
      this.requirePermission('users', 'read')
    }

    const { page = 1, pageSize = 20, search, sort = 'createdAt', order = 'DESC', filter } = options

    const publicDs = await tenantPool.acquire('public')
    try {
      const repo = publicDs.getRepository(PUBLIC_ENTITIES[entity])
      const queryBuilder = repo
        .createQueryBuilder('entity')
        .where('entity.tenantId = :tenantId', { tenantId: this.tenantId })

      if (search) {
        queryBuilder.andWhere('(entity.name ILIKE :search OR entity.email ILIKE :search)', {
          search: `%${search}%`
        })
      }

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value })
        })
      }

      const [data, total] = await queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(`entity.${sort}`, order)
        .getManyAndCount()

      return {
        data,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
      }
    } finally {
      tenantPool.release('public')
    }
  }

  async updatePublic<T extends keyof typeof PUBLIC_ENTITIES>(
    entity: T,
    id: string,
    data: Record<string, any>
  ): Promise<CRUDResult<any>> {
    try {
      if (entity === 'users') {
        // 只能 admin 或本人修改
        if (id !== this.userId && !this.accountability.permissions.admin) {
          throw new Error('Permission denied')
        }
        // 非 admin 不可修改角色
        if (data.role && !this.accountability.permissions.admin) {
          throw new Error('Admin permission required to change role')
        }
      }

      const publicDs = await tenantPool.acquire('public')
      try {
        const repo = publicDs.getRepository(PUBLIC_ENTITIES[entity])
        const instance = await repo.findOne({ where: { id, tenantId: this.tenantId } })

        if (!instance) {
          return { data: null, success: false, message: 'Not found' }
        }

        Object.assign(instance, data)
        const result = await repo.save(instance)
        return { data: result, success: true }
      } finally {
        tenantPool.release('public')
      }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async deletePublic<T extends keyof typeof PUBLIC_ENTITIES>(
    entity: T,
    id: string
  ): Promise<CRUDResult<boolean>> {
    try {
      if (entity === 'users') {
        this.requirePermission('users', 'delete')
        if (id === this.userId) {
          throw new Error('Cannot delete yourself')
        }
      }

      const publicDs = await tenantPool.acquire('public')
      try {
        const repo = publicDs.getRepository(PUBLIC_ENTITIES[entity])
        const instance = await repo.findOne({ where: { id, tenantId: this.tenantId } })

        if (!instance) {
          return { data: false, success: false, message: 'Not found' }
        }

        await repo.remove(instance)
        return { data: true, success: true }
      } finally {
        tenantPool.release('public')
      }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  // ============ 聚合查询 ============

  async count<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    filter?: Record<string, any>
  ): Promise<number> {
    const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
    const queryBuilder = repo
      .createQueryBuilder('entity')
      .where('entity.tenantId = :tenantId', { tenantId: this.tenantId })

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value })
      })
    }

    return queryBuilder.getCount()
  }

  async aggregate<T extends keyof typeof TENANT_ENTITIES>(
    entity: T,
    field: string,
    operation: 'sum' | 'avg' | 'max' | 'min' | 'count',
    filter?: Record<string, any>
  ): Promise<number> {
    const repo = this.dataSource.getRepository(TENANT_ENTITIES[entity])
    const queryBuilder = repo
      .createQueryBuilder('entity')
      .select(
        operation === 'count'
          ? `COUNT(entity.${field})`
          : `${operation.toUpperCase()}(entity.${field})`,
        'result'
      )
      .where('entity.tenantId = :tenantId', { tenantId: this.tenantId })

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value })
      })
    }

    const result = await queryBuilder.getRawOne()
    return parseFloat(result?.result || '0')
  }

  // ============ 版本管理 ============

  async getVersions(schemaId: string): Promise<FormSchemaVersion[]> {
    this.requirePermission('formSchemas', 'read')
    return this.dataSource.getRepository(FormSchemaVersion).find({
      where: { schemaId },
      order: { version: 'DESC' }
    })
  }

  async restoreVersion(schemaId: string, version: number): Promise<CRUDResult<FormSchema>> {
    try {
      this.requirePermission('formSchemas', 'update')

      const versionRecord = await this.dataSource
        .getRepository(FormSchemaVersion)
        .findOne({ where: { schemaId, version } })

      if (!versionRecord) {
        return { data: null, success: false, message: 'Version not found' }
      }

      const repo = this.dataSource.getRepository(FormSchema)
      const schema = await repo.findOne({ where: { id: schemaId, tenantId: this.tenantId } })

      if (!schema) {
        return { data: null, success: false, message: 'Schema not found' }
      }

      // 保存当前版本
      const currentVersion = this.dataSource.getRepository(FormSchemaVersion).create({
        schemaId,
        version: schema.version,
        schema: schema.schema,
        createdBy: this.userId,
        changelog: `Restored from version ${version}`
      })
      await this.dataSource.getRepository(FormSchemaVersion).save(currentVersion)

      // 恢复
      schema.schema = versionRecord.schema
      schema.version += 1
      schema.updatedBy = this.userId

      const result = await repo.save(schema)
      return { data: result, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  // ============ 分享功能 ============

  async createShareToken(schemaId: string): Promise<string> {
    this.requirePermission('formSchemas', 'read')
    const token = crypto.randomBytes(16).toString('hex')
    await this.dataSource
      .getRepository(FormSchema)
      .update({ id: schemaId, tenantId: this.tenantId } as any, { shareToken: token } as any)
    return token
  }

  async getSchemaByShareToken(token: string): Promise<FormSchema | null> {
    return this.dataSource.getRepository(FormSchema).findOne({ where: { shareToken: token } })
  }

  // ============ 文件操作 ============

  private storagePath = process.env.FILE_STORAGE_PATH || './uploads'

  async uploadFile(file: {
    filename: string
    buffer: Buffer
    mimeType: string
    folder?: string
  }): Promise<CRUDResult<FileUploadResult>> {
    try {
      this.requirePermission('files', 'create')

      const id = crypto.randomUUID()
      const ext = path.extname(file.filename)
      const filename = `${id}${ext}`
      const folder = file.folder || 'general'
      const fullPath = path.join(this.storagePath, this.tenantId, folder)

      await fs.mkdir(fullPath, { recursive: true })
      await fs.writeFile(path.join(fullPath, filename), file.buffer)

      const url = `/files/${this.tenantId}/${folder}/${filename}`

      return {
        data: {
          id,
          filename: file.filename,
          url,
          size: file.buffer.length,
          mimeType: file.mimeType
        },
        success: true
      }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async deleteFile(id: string): Promise<CRUDResult<boolean>> {
    try {
      this.requirePermission('files', 'delete')
      const filepath = path.join(this.storagePath, this.tenantId, 'general', id)
      try {
        await fs.unlink(filepath)
      } catch {}
      return { data: true, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async getFile(id: string): Promise<Buffer | null> {
    try {
      this.requirePermission('files', 'read')
      return await fs.readFile(path.join(this.storagePath, this.tenantId, 'general', id))
    } catch {
      return null
    }
  }

  getFileUrl(id: string, folder = 'general'): string {
    return `/files/${this.tenantId}/${folder}/${id}`
  }

  // ============ 工具方法 ============

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!sql.toLowerCase().includes('tenant_id')) {
      throw new Error('Query must include tenant_id filter')
    }
    return this.dataSource.query(sql, params) as Promise<T[]>
  }

  async transaction<T>(callback: (ctx: TenantContext) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.startTransaction()

    try {
      const tempCtx = new TenantContext(
        this.tenantId,
        this.userId,
        queryRunner.connection as any,
        this.accountability
      )
      const result = await callback(tempCtx)
      await queryRunner.commitTransaction()
      return result
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }
}

export default TenantContext
