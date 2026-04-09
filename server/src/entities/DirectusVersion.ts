import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

/**
 * Directus 版本实体
 * 对应数据库表: directus_versions
 */
@Entity('directus_versions')
export class DirectusVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 64 })
  collection!: string

  @Column({ type: 'varchar', length: 255 })
  item!: string

  @Column({ type: 'json' })
  data!: Record<string, any>

  @Column({ name: 'hash', type: 'varchar', length: 64, nullable: true })
  hash?: string

  @Column({ type: 'boolean', default: false })
  latest!: boolean

  @Column({ type: 'boolean', default: false })
  published!: boolean

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date

  @Column({ type: 'uuid' })
  createdBy!: string

  @Column({ name: 'created_on', type: 'timestamptz' })
  createdOn!: Date

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string

  @Column({ name: 'updated_on', type: 'timestamptz', nullable: true })
  updatedOn?: Date
}
