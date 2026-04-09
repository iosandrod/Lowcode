/**
 * Entity 统一导出
 *
 * 目录结构:
 * - system/: System 数据库实体 (tenants, system_users, system_roles)
 * - tenant/: Tenant 独立数据库实体 (users, tenant_roles, form_schemas, submissions)
 * - Directus Entity: 原始 Directus 表结构（只读，用于兼容）
 */

// ============ System 数据库 Entity ============
export { SystemUser, SystemRole, Tenant } from './system'

// ============ Tenant 独立数据库 Entity ============
export { TenantUser, TenantRole } from './tenant'

// ============ 业务 Entity ============
export { FormSchema, FormSchemaVersion, FormSubmission } from './FormSchema'

// ============ Directus 原始 Entity (只读兼容) ============
export { DirectusUser } from './DirectusUser'
export { DirectusRole } from './DirectusRole'
export { DirectusPermission } from './DirectusPermission'
export { DirectusPolicy } from './DirectusPolicy'
export { DirectusAccess } from './DirectusAccess'
export { DirectusCollection } from './DirectusCollection'
export { DirectusField } from './DirectusField'
export { DirectusFile } from './DirectusFile'
export { DirectusFolder } from './DirectusFolder'
export { DirectusSession } from './DirectusSession'
export { DirectusShare } from './DirectusShare'
export { DirectusActivity } from './DirectusActivity'
export { DirectusRevision } from './DirectusRevision'
export { DirectusVersion } from './DirectusVersion'
