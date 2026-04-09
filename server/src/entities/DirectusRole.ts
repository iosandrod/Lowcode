import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm'
import { DirectusUser } from './DirectusUser'
import { DirectusPermission } from './DirectusPermission'
import { DirectusPreset } from './DirectusPreset'

/**
 * Directus 角色实体
 * 对应数据库表: directus_roles
 */
@Entity('directus_roles')
export class DirectusRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'varchar', length: 64 })
  icon!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'uuid', nullable: true })
  parent?: string

  // ============ 关系 ============

  @ManyToOne(() => DirectusRole, { nullable: true })
  @JoinColumn({ name: 'parent' })
  parentRole?: DirectusRole

  @OneToMany(() => DirectusRole, (role) => role.parentRole)
  children?: DirectusRole[]

  @OneToMany(() => DirectusUser, (user) => user.roleRelation)
  users?: DirectusUser[]

  @OneToMany(() => DirectusPermission, (permission) => permission.policyRelation)
  permissions?: DirectusPermission[]

  @OneToMany(() => DirectusPreset, (preset) => preset.roleRelation)
  presets?: DirectusPreset[]
}
