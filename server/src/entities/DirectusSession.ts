import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { DirectusUser } from './DirectusUser'
import { DirectusShare } from './DirectusShare'

/**
 * Directus 会话实体
 * 对应数据库表: directus_sessions
 */
@Entity('directus_sessions')
export class DirectusSession {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  token!: string

  @Column({ type: 'uuid', nullable: true })
  user?: string

  @Column({ type: 'timestamptz' })
  expires!: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip?: string

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string

  @Column({ type: 'uuid', nullable: true })
  share?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  origin?: string

  @Column({ name: 'next_token', type: 'varchar', length: 64, nullable: true })
  nextToken?: string

  // ============ 关系 ============

  @ManyToOne(() => DirectusUser)
  @JoinColumn({ name: 'user' })
  userRelation?: DirectusUser

  @ManyToOne(() => DirectusShare)
  @JoinColumn({ name: 'share' })
  shareRelation?: DirectusShare
}
