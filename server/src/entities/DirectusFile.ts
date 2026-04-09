import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { DirectusUser } from './DirectusUser'
import { DirectusFolder } from './DirectusFolder'

/**
 * Directus 文件实体
 * 对应数据库表: directus_files
 */
@Entity('directus_files')
export class DirectusFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  storage!: string

  @Column({ name: 'filename_disk', type: 'varchar', length: 255, nullable: true })
  filenameDisk?: string

  @Column({ name: 'filename_download', type: 'varchar', length: 255 })
  filenameDownload!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  type?: string

  @Column({ type: 'uuid', nullable: true })
  folder?: string

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy?: string

  @Column({ name: 'created_on', type: 'timestamptz' })
  createdOn!: Date

  @Column({ name: 'modified_by', type: 'uuid', nullable: true })
  modifiedBy?: string

  @Column({ name: 'modified_on', type: 'timestamptz' })
  modifiedOn!: Date

  @Column({ type: 'varchar', length: 50, nullable: true })
  charset?: string

  @Column({ name: 'filesize', type: 'bigint', nullable: true })
  filesize?: number

  @Column({ type: 'int', nullable: true })
  width?: number

  @Column({ type: 'int', nullable: true })
  height?: number

  @Column({ type: 'int', nullable: true })
  duration?: number

  @Column({ type: 'varchar', length: 200, nullable: true })
  embed?: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'text', nullable: true })
  location?: string

  @Column({ type: 'text', nullable: true })
  tags?: string

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @Column({ name: 'focal_point_x', type: 'int', nullable: true })
  focalPointX?: number

  @Column({ name: 'focal_point_y', type: 'int', nullable: true })
  focalPointY?: number

  @Column({ name: 'tus_id', type: 'varchar', length: 64, nullable: true })
  tusId?: string

  @Column({ name: 'tus_data', type: 'json', nullable: true })
  tusData?: Record<string, any>

  @Column({ name: 'uploaded_on', type: 'timestamptz', nullable: true })
  uploadedOn?: Date

  // ============ 关系 ============

  @ManyToOne(() => DirectusUser)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedByUser?: DirectusUser

  @ManyToOne(() => DirectusUser)
  @JoinColumn({ name: 'modified_by' })
  modifiedByUser?: DirectusUser

  @ManyToOne(() => DirectusFolder)
  @JoinColumn({ name: 'folder' })
  folderRelation?: DirectusFolder
}
