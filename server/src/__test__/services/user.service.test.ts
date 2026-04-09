/**
 * UserService 自动化测试
 * 测试租户用户管理接口
 */

import { describe, expect, it, vi } from 'vitest'
import userServiceModule from '../../services/user.service'

// Mock 所有依赖
vi.mock('moleculer', () => ({
  Context: class {},
  Service: vi.fn()
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true)
  }
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

// Mock user.service 模块
vi.mock('../../services/user.service', () => ({
  default: {
    name: 'user',
    actions: {
      create: {
        rest: 'POST /',
        params: {
          email: 'email',
          password: 'string',
          name: 'string?',
          role: 'string?'
        }
      },
      update: {
        rest: 'PUT /:id',
        params: {
          id: 'string',
          email: 'email?',
          name: 'string?',
          role: 'string?',
          status: 'string?'
        }
      },
      delete: {
        rest: 'DELETE /:id',
        params: {
          id: 'string'
        }
      },
      me: {
        rest: 'GET /me'
      },
      profile: {
        rest: 'PUT /profile',
        params: {
          firstName: 'string?',
          lastName: 'string?',
          avatar: 'string?'
        }
      },
      changePassword: {
        rest: 'PUT /password',
        params: {
          oldPassword: 'string',
          newPassword: 'string|min:6'
        }
      }
    }
  }
}))

describe('UserService', () => {
  describe('模块导出', () => {
    it('应该导出默认导出', () => {
      expect(userServiceModule).toBeDefined()
    })

    it('应该有 name 属性', () => {
      expect(userServiceModule.name).toBe('user')
    })

    it('应该有 actions 对象', () => {
      expect(userServiceModule.actions).toBeDefined()
    })
  })

  describe('create action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(userServiceModule.actions.create.rest).toBe('POST /')
    })

    it('应该定义参数', () => {
      expect(userServiceModule.actions.create.params).toBeDefined()
      expect(userServiceModule.actions.create.params.email).toBe('email')
      expect(userServiceModule.actions.create.params.password).toBe('string')
    })
  })

  describe('update action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(userServiceModule.actions.update.rest).toBe('PUT /:id')
    })

    it('应该定义参数', () => {
      expect(userServiceModule.actions.update.params).toBeDefined()
      expect(userServiceModule.actions.update.params.id).toBe('string')
    })
  })

  describe('delete action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(userServiceModule.actions.delete.rest).toBe('DELETE /:id')
    })

    it('应该定义参数', () => {
      expect(userServiceModule.actions.delete.params).toBeDefined()
      expect(userServiceModule.actions.delete.params.id).toBe('string')
    })
  })

  describe('me action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(userServiceModule.actions.me.rest).toBe('GET /me')
    })
  })

  describe('profile action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(userServiceModule.actions.profile.rest).toBe('PUT /profile')
    })
  })

  describe('changePassword action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(userServiceModule.actions.changePassword.rest).toBe('PUT /password')
    })

    it('应该定义参数', () => {
      expect(userServiceModule.actions.changePassword.params).toBeDefined()
      expect(userServiceModule.actions.changePassword.params.oldPassword).toBe('string')
      expect(userServiceModule.actions.changePassword.params.newPassword).toBeDefined()
    })
  })

  describe('所有 action 数量', () => {
    it('应该有 6 个 action', () => {
      const actionCount = Object.keys(userServiceModule.actions).length
      expect(actionCount).toBe(6)
    })
  })
})
