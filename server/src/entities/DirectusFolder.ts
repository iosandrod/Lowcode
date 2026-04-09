import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { DirectusFile } from './DirectusFile'

/**
 * Directus 文件夹实体
 * 对应数据库表: directus_folders
 */
@Entity('directus_folders')
export class DirectusFolder {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'uuid', nullable: true })
  parent?: string

  // ============ 关系 ============

  @ManyToOne(() => DirectusFolder, { nullable: true })
  @JoinColumn({ name: 'parent' })
  parentFolder?: DirectusFolder

  @OneToMany(() => DirectusFile, (file) => file.folderRelation)
  files?: DirectusFile[]
}
