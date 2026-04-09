import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm'
import { DirectusField } from './DirectusField'

/**
 * Directus 集合实体
 * 对应数据库表: directus_collections
 */
@Entity('directus_collections')
export class DirectusCollection {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  collection!: string

  @Column({ type: 'varchar', length: 64, nullable: true })
  icon?: string

  @Column({ type: 'text', nullable: true })
  note?: string

  @Column({ name: 'display_template', type: 'varchar', length: 255, nullable: true })
  displayTemplate?: string

  @Column({ type: 'boolean', default: false })
  hidden!: boolean

  @Column({ type: 'boolean', default: false })
  singleton!: boolean

  @Column({ type: 'json', nullable: true })
  translations?: Record<string, string>

  @Column({ name: 'archive_field', type: 'varchar', length: 64, nullable: true })
  archiveField?: string

  @Column({ name: 'archive_app_filter', type: 'boolean', nullable: true })
  archiveAppFilter?: boolean

  @Column({ name: 'archive_value', type: 'varchar', length: 255, nullable: true })
  archiveValue?: string

  @Column({ name: 'unarchive_value', type: 'varchar', length: 255, nullable: true })
  unarchiveValue?: string

  @Column({ name: 'sort_field', type: 'varchar', length: 64, nullable: true })
  sortField?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  accountability?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  color?: string

  @Column({ name: 'item_duplication_fields', type: 'json', nullable: true })
  itemDuplicationFields?: Record<string, any>

  @Column({ type: 'int', nullable: true })
  sort?: number

  @Column({ type: 'varchar', length: 64, nullable: true })
  group?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  collapse?: string

  @Column({ name: 'preview_url', type: 'varchar', length: 255, nullable: true })
  previewUrl?: string

  @Column({ type: 'boolean', default: false })
  versioning!: boolean

  @Column({ type: 'text', nullable: true })
  layout?: string

  // ============ 关系 ============

  @OneToMany(() => DirectusField, (field) => field.collectionRelation)
  fields?: DirectusField[]
}
