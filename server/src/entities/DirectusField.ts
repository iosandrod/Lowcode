import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { DirectusCollection } from './DirectusCollection'

/**
 * Directus 字段实体
 * 对应数据库表: directus_fields
 */
@Entity('directus_fields')
export class DirectusField {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 64 })
  collection!: string

  @Column({ type: 'varchar', length: 64 })
  field!: string

  @Column({ type: 'varchar', length: 64, nullable: true })
  special?: string

  @Column({ type: 'varchar', length: 64, nullable: true })
  interface?: string

  @Column({ type: 'json', nullable: true })
  options?: Record<string, any>

  @Column({ type: 'varchar', length: 64, nullable: true })
  display?: string

  @Column({ name: 'display_options', type: 'json', nullable: true })
  displayOptions?: Record<string, any>

  @Column({ type: 'boolean', default: false })
  readonly!: boolean

  @Column({ type: 'boolean', default: false })
  hidden!: boolean

  @Column({ type: 'int', nullable: true })
  sort?: number

  @Column({ type: 'varchar', length: 30, nullable: true })
  width?: string

  @Column({ type: 'json', nullable: true })
  translations?: Record<string, string>

  @Column({ type: 'text', nullable: true })
  note?: string

  @Column({ type: 'json', nullable: true })
  conditions?: Record<string, any>

  @Column({ type: 'boolean', nullable: true })
  required?: boolean

  @Column({ type: 'varchar', length: 64, nullable: true })
  group?: string

  @Column({ type: 'json', nullable: true })
  validation?: Record<string, any>

  @Column({ name: 'validation_message', type: 'text', nullable: true })
  validationMessage?: string

  @Column({ type: 'boolean', default: true })
  searchable!: boolean

  // ============ 关系 ============

  @ManyToOne(() => DirectusCollection, (collection) => collection.fields)
  @JoinColumn({ name: 'collection' })
  collectionRelation?: DirectusCollection
}
