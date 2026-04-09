import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { DirectusActivity } from './DirectusActivity'
import { DirectusVersion } from './DirectusVersion'

/**
 * Directus 修订版本实体
 * 对应数据库表: directus_revisions
 */
@Entity('directus_revisions')
export class DirectusRevision {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'int' })
  activity!: number

  @Column({ type: 'varchar', length: 64 })
  collection!: string

  @Column({ type: 'varchar', length: 255 })
  item!: string

  @Column({ type: 'json', nullable: true })
  data?: Record<string, any>

  @Column({ type: 'json', nullable: true })
  delta?: Record<string, any>

  @Column({ type: 'int', nullable: true })
  parent?: number

  @Column({ type: 'uuid', nullable: true })
  version?: string

  // ============ 关系 ============

  @ManyToOne(() => DirectusActivity)
  @JoinColumn({ name: 'activity' })
  activityRelation?: DirectusActivity

  @ManyToOne(() => DirectusRevision, { nullable: true })
  @JoinColumn({ name: 'parent' })
  parentRevision?: DirectusRevision

  @ManyToOne(() => DirectusVersion, { nullable: true })
  @JoinColumn({ name: 'version' })
  versionRelation?: DirectusVersion
}
