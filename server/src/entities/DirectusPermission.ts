import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { DirectusRole } from './DirectusRole'

/**
 * Directus 权限实体
 * 对应数据库表: directus_permissions
 */
@Entity('directus_permissions')
export class DirectusPermission {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 64 })
  collection!: string

  @Column({ type: 'varchar', length: 10 })
  action!: string

  @Column({ type: 'json', nullable: true })
  permissions?: Record<string, any>

  @Column({ type: 'json', nullable: true })
  validation?: Record<string, any>

  @Column({ type: 'json', nullable: true })
  presets?: Record<string, any>

  @Column({ type: 'text', nullable: true })
  fields?: string

  @Column({ type: 'uuid' })
  policy!: string

  // ============ 关系 ============

  @ManyToOne(() => DirectusRole, (role) => role.permissions)
  @JoinColumn({ name: 'policy' })
  policyRelation?: DirectusRole
}
