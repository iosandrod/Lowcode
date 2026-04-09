import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { DirectusUser } from './DirectusUser'
import { DirectusRole } from './DirectusRole'
import { DirectusPolicy } from './DirectusPolicy'

/**
 * Directus 用户-角色访问关联实体
 * 对应数据库表: directus_access
 */
@Entity('directus_access')
export class DirectusAccess {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'uuid' })
  user!: string

  @Column({ type: 'uuid' })
  role!: string

  @Column({ type: 'uuid' })
  policy!: string

  // ============ 关系 ============

  @ManyToOne(() => DirectusUser)
  @JoinColumn({ name: 'user' })
  userRelation?: DirectusUser

  @ManyToOne(() => DirectusRole)
  @JoinColumn({ name: 'role' })
  roleRelation?: DirectusRole

  @ManyToOne(() => DirectusPolicy)
  @JoinColumn({ name: 'policy' })
  policyRelation?: DirectusPolicy
}
