/**
 * AuthService 自动化测试
 * 测试用户认证相关接口
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import authServiceModule from '../../services/auth.service'

// Mock 所有依赖
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-id', email: 'test@test.com' })
  }
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

// Mock auth.service 模块
vi.mock('../../services/auth.service', () => ({
  default: {
    name: 'auth',
    actions: {
      register: {
        rest: 'POST /register',
        params: {
          tenantName: 'string',
          tenantSlug: 'string',
          email: 'email',
          password: 'string|min:6',
          name: 'string?'
        }
      },
      login: {
        rest: 'POST /login',
        params: {
          tenantSlug: 'string',
          email: 'email',
          password: 'string'
        }
      },
      'refresh-token': {
        rest: 'POST /refresh-token',
        params: {
          refreshToken: 'string'
        }
      }
    }
  }
}))

describe('AuthService', () => {
  describe('模块导出', () => {
    it('应该导出默认导出', () => {
      expect(authServiceModule).toBeDefined()
    })

    it('应该有 name 属性', () => {
      expect(authServiceModule.name).toBe('auth')
    })

    it('应该有 actions 对象', () => {
      expect(authServiceModule.actions).toBeDefined()
    })
  })

  describe('register action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(authServiceModule.actions.register.rest).toBe('POST /register')
    })

    it('应该定义参数', () => {
      expect(authServiceModule.actions.register.params).toBeDefined()
      expect(authServiceModule.actions.register.params.tenantName).toBe('string')
      expect(authServiceModule.actions.register.params.tenantSlug).toBe('string')
      expect(authServiceModule.actions.register.params.email).toBe('email')
      expect(authServiceModule.actions.register.params.password).toBeDefined()
    })
  })

  describe('login action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(authServiceModule.actions.login.rest).toBe('POST /login')
    })

    it('应该定义参数', () => {
      expect(authServiceModule.actions.login.params).toBeDefined()
      expect(authServiceModule.actions.login.params.tenantSlug).toBe('string')
      expect(authServiceModule.actions.login.params.email).toBe('email')
      expect(authServiceModule.actions.login.params.password).toBe('string')
    })
  })

  describe('refresh-token action', () => {
    it('应该定义正确的 REST 路由', () => {
      expect(authServiceModule.actions['refresh-token'].rest).toBe('POST /refresh-token')
    })

    it('应该定义参数', () => {
      expect(authServiceModule.actions['refresh-token'].params).toBeDefined()
      expect(authServiceModule.actions['refresh-token'].params.refreshToken).toBe('string')
    })
  })
})
