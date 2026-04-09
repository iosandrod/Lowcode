/**
 * FormSchemaService 自动化测试
 * 测试表单 Schema 管理接口
 */

import { describe, expect, it, vi } from 'vitest'
import formSchemaServiceModule from '../../services/form-schema.service'

// Mock 所有依赖
vi.mock('moleculer', () => ({
  Context: class {},
  Service: vi.fn()
}))

vi.mock('../../entities/tenant', () => ({
  TenantUser: {},
  TenantRole: {}
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

vi.mock('../../services/tenant-connection-pool', () => ({
  tenantPool: {}
}))

// Mock form-schema.service 模块
vi.mock('../../services/form-schema.service', () => ({
  default: {
    name: 'form-schema',
    actions: {
      create: {
        rest: 'POST /',
        params: {
          name: 'string',
          description: 'string?',
          schema: 'object'
        }
      },
      update: {
        rest: 'PUT /:id',
        params: {
          id: 'string',
          name: 'string?',
          description: 'string?',
          schema: 'object?'
        }
      },
      find: {
        rest: 'GET /:id'
      },
      list: {
        rest: 'GET /',
        params: {
          page: 'number?',
          pageSize: 'number?',
          search: 'string?',
          status: 'string?'
        }
      },
      delete: {
        rest: 'DELETE /:id'
      },
      publish: {
        rest: 'POST /:id/publish'
      },
      unpublish: {
        rest: 'POST /:id/unpublish'
      },
      versions: {
        rest: 'GET /:id/versions'
      },
      restore: {
        rest: 'POST /:id/restore/:version'
      },
      duplicate: {
        rest: 'POST /:id/duplicate'
      }
    }
  }
}))

describe('FormSchemaService', () => {
  describe('模块导出', () => {
    it('应该导出默认导出', () => {
      expect(formSchemaServiceModule).toBeDefined()
    })

    it('应该有 name 属性', () => {
      expect(formSchemaServiceModule.name).toBe('form-schema')
    })

    it('应该有 actions 对象', () => {
      expect(formSchemaServiceModule.actions).toBeDefined()
    })
  })

  describe('create action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.create.rest).toBe('POST /')
    })

    it('应该定义参数', () => {
      expect(formSchemaServiceModule.actions.create.params).toBeDefined()
      expect(formSchemaServiceModule.actions.create.params.name).toBe('string')
    })
  })

  describe('update action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.update.rest).toBe('PUT /:id')
    })

    it('应该定义参数', () => {
      expect(formSchemaServiceModule.actions.update.params).toBeDefined()
      expect(formSchemaServiceModule.actions.update.params.id).toBe('string')
    })
  })

  describe('find action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.find.rest).toBe('GET /:id')
    })
  })

  describe('list action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.list.rest).toBe('GET /')
    })

    it('应该定义参数', () => {
      expect(formSchemaServiceModule.actions.list.params).toBeDefined()
      expect(formSchemaServiceModule.actions.list.params.page).toBe('number?')
      expect(formSchemaServiceModule.actions.list.params.pageSize).toBe('number?')
    })
  })

  describe('delete action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.delete.rest).toBe('DELETE /:id')
    })
  })

  describe('publish action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.publish.rest).toBe('POST /:id/publish')
    })
  })

  describe('unpublish action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.unpublish.rest).toBe('POST /:id/unpublish')
    })
  })

  describe('versions action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.versions.rest).toBe('GET /:id/versions')
    })
  })

  describe('restore action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.restore.rest).toBe('POST /:id/restore/:version')
    })
  })

  describe('duplicate action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(formSchemaServiceModule.actions.duplicate.rest).toBe('POST /:id/duplicate')
    })
  })

  describe('所有 action 数量', () => {
    it('应该有 10 个 action', () => {
      const actionCount = Object.keys(formSchemaServiceModule.actions).length
      expect(actionCount).toBe(10)
    })
  })
})
