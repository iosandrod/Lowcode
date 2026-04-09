import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { DirectusUser } from './DirectusUser'
import { DirectusRole } from './DirectusRole'

/**
 * Directus 分享实体
 * 对应数据库表: directus_shares
 */
@Entity('directus_shares')
export class DirectusShare {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string

  @Column({ type: 'varchar', length: 64 })
  collection!: string

  @Column({ type: 'varchar', length: 255 })
  item!: string

  @Column({ type: 'uuid', nullable: true })
  role?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string

  @Column({ name: 'user_created', type: 'uuid' })
  userCreated!: string

  @Column({ name: 'date_created', type: 'timestamptz' })
  dateCreated!: Date

  @Column({ name: 'date_start', type: 'timestamptz', nullable: true })
  dateStart?: Date

  @Column({ name: 'date_end', type: 'timestamptz', nullable: true })
  dateEnd?: Date

  @Column({ name: 'times_used', type: 'int', default: 0 })
  timesUsed!: number

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses?: number

  // ============ 关系 ============

  @ManyToOne(() => DirectusUser)
  @JoinColumn({ name: 'user_created' })
  creator?: DirectusUser

  @ManyToOne(() => DirectusRole)
  @JoinColumn({ name: 'role' })
  roleRelation?: DirectusRole
}
