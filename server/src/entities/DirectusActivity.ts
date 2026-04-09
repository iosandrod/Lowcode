import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { DirectusUser } from './DirectusUser'

/**
 * Directus 活动日志实体
 * 对应数据库表: directus_activity
 */
@Entity('directus_activity')
export class DirectusActivity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 45 })
  action!: string

  @Column({ type: 'uuid', nullable: true })
  user?: string

  @Column({ name: 'timestamp', type: 'timestamptz' })
  timestamp!: Date

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip?: string

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string

  @Column({ type: 'varchar', length: 64 })
  collection!: string

  @Column({ type: 'varchar', length: 255 })
  item!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  origin?: string

  // ============ 关系 ============

  @ManyToOne(() => DirectusUser)
  @JoinColumn({ name: 'user' })
  userRelation?: DirectusUser
}
