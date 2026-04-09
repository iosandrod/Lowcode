/**
 * TenantContext 自动化测试
 */

import { describe, expect, it, vi } from 'vitest'
import { TenantContext } from '../../context/TenantContext'

// Mock 依赖
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true)
  }
}))

vi.mock('../../services/tenant-connection-pool', () => ({
  tenantPool: {
    acquire: vi.fn().mockResolvedValue({
      getRepository: vi.fn().mockReturnValue({
        findOne: vi.fn(),
        find: vi.fn(),
        create: vi.fn().mockImplementation((data) => data),
        save: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'test-id', ...data })),
        update: vi.fn(),
        remove: vi.fn(),
        createQueryBuilder: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          take: vi.fn().mockReturnThis(),
          getManyAndCount: vi.fn().mockResolvedValue([[], 0])
        })
      })
    }),
    release: vi.fn()
  }
}))

vi.mock('../../entities/tenant', () => ({
  TenantUser: {},
  TenantRole: {
    findOne: vi.fn(),
    find: vi.fn()
  }
}))

vi.mock('../../entities/system', () => ({
  Tenant: {}
}))

vi.mock('../../entities', () => ({
  FormSchema: {},
  FormSchemaVersion: {},
  FormSubmission: {}
}))

vi.mock('../../database/system-data-source', () => ({
  systemDataSource: {}
}))

describe('TenantContext', () => {
  describe('构造函数', () => {
    it('应该正确初始化基本属性', () => {
      const mockDs = {} as any
      const ctx = new TenantContext('tenant-1', 'user-1', mockDs)

      expect(ctx.tenantId).toBe('tenant-1')
      expect(ctx.userId).toBe('user-1')
      expect(ctx.dataSource).toBe(mockDs)
      expect(ctx.accountability.userId).toBe('user-1')
      expect(ctx.accountability.tenantId).toBe('tenant-1')
    })

    it('应该正确设置权限', () => {
      const mockDs = {} as any
      const ctx = new TenantContext('tenant-1', 'user-1', mockDs, {
        role: 'admin',
        permissions: { admin: true }
      })

      expect(ctx.accountability.role).toBe('admin')
      expect(ctx.accountability.permissions.admin).toBe(true)
    })
  })

  describe('权限校验', () => {
    it('admin 应该通过所有权限检查', () => {
      const mockDs = {} as any
      const ctx = new TenantContext('tenant-1', 'user-1', mockDs, {
        permissions: { admin: true }
      })

      expect(ctx.hasPermission('formSchemas', 'create')).toBe(true)
      expect(ctx.hasPermission('formSchemas', 'delete')).toBe(true)
      expect(ctx.hasPermission('users', 'delete')).toBe(true)
    })

    it('member 角色应该正确检查权限', () => {
      const mockDs = {} as any
      const ctx = new TenantContext('tenant-1', 'user-1', mockDs, {
        permissions: {
          formSchemas: { create: true, read: true, update: false, delete: false }
        }
      })

      expect(ctx.hasPermission('formSchemas', 'create')).toBe(true)
      expect(ctx.hasPermission('formSchemas', 'delete')).toBe(false)
    })

    it('requirePermission 应该在权限不足时抛出错误', () => {
      const mockDs = {} as any
      const ctx = new TenantContext('tenant-1', 'user-1', mockDs, {
        permissions: {
          formSchemas: { create: false, read: true, update: false, delete: false }
        }
      })

      expect(() => ctx.requirePermission('formSchemas', 'create')).toThrow('Permission denied')
    })

    it('requirePermission 应该在权限足够时通过', () => {
      const mockDs = {} as any
      const ctx = new TenantContext('tenant-1', 'user-1', mockDs, {
        permissions: {
          formSchemas: { create: true, read: true, update: false, delete: false }
        }
      })

      expect(() => ctx.requirePermission('formSchemas', 'read')).not.toThrow()
    })
  })

  describe('mergePermissions', () => {
    it('应该正确合并权限', () => {
      const base: any = {
        formSchemas: { create: true, read: true, update: false, delete: false }
      }
      const override: any = {
        formSchemas: { delete: true }
      }

      TenantContext.mergePermissions(base, override)

      expect(base.formSchemas.create).toBe(true)
      expect(base.formSchemas.read).toBe(true)
      expect(base.formSchemas.delete).toBe(true)
    })

    it('应该允许用户权限覆盖角色权限', () => {
      const base: any = {
        formSchemas: { create: true, read: true, update: true, delete: true }
      }
      const override: any = {
        formSchemas: { delete: false }
      }

      TenantContext.mergePermissions(base, override)

      expect(base.formSchemas.delete).toBe(false)
    })
  })
})
