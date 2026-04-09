import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { DirectusUser } from './DirectusUser'
import { DirectusRole } from './DirectusRole'

/**
 * Directus 预设/收藏实体
 * 对应数据库表: directus_presets
 */
@Entity('directus_presets')
export class DirectusPreset {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'bookmark', type: 'varchar', length: 255, nullable: true })
  bookmark?: string

  @Column({ type: 'uuid', nullable: true })
  user?: string

  @Column({ type: 'uuid', nullable: true })
  role?: string

  @Column({ type: 'varchar', length: 64, nullable: true })
  collection?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  search?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  layout?: string

  @Column({ name: 'layout_query', type: 'json', nullable: true })
  layoutQuery?: Record<string, any>

  @Column({ name: 'layout_options', type: 'json', nullable: true })
  layoutOptions?: Record<string, any>

  @Column({ name: 'refresh_interval', type: 'int', nullable: true })
  refreshInterval?: number

  @Column({ type: 'json', nullable: true })
  filter?: Record<string, any>

  @Column({ type: 'varchar', length: 64, nullable: true })
  icon?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  color?: string

  // ============ 关系 ============

  @ManyToOne(() => DirectusUser, (user) => user.presets)
  @JoinColumn({ name: 'user' })
  userRelation?: DirectusUser

  @ManyToOne(() => DirectusRole, (role) => role.presets)
  @JoinColumn({ name: 'role' })
  roleRelation?: DirectusRole
}
