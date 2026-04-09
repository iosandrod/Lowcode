import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'

/**
 * 系统角色 - 平台级角色
 */
@Entity('system_roles')
export class SystemRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 50 })
  name!: string

  @Column({ type: 'varchar', length: 50, unique: true })
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
    tenants?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
    systemUsers?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
    settings?: { read?: boolean; update?: boolean }
  }

  // 系统内置角色不可删除
  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean

  @Column({ type: 'boolean', default: false })
  admin!: boolean // 超级管理员

  @Column({ name: 'sort', type: 'int', default: 0 })
  sort!: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
