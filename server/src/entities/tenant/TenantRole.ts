import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 * 租户角色 - 存放在各租户独立数据库中
 */
@Entity('tenant_roles')
export class TenantRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 50 })
  name!: string

  @Column({ type: 'varchar', length: 50 })
  slug!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'varchar', length: 64 })
  icon?: string

  @Column({ type: 'varchar', length: 32, default: '#409EFF' })
  color?: string

  // 权限配置
  @Column({ type: 'jsonb', nullable: true })
  permissions?: {
    formSchemas?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
    submissions?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
    users?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
    settings?: { read?: boolean; update?: boolean }
  }

  // 继承关系
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string

  // 系统内置角色不可删除
  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean

  @Column({ type: 'boolean', default: false })
  admin!: boolean // 管理员角色

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort!: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
