import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm'
import { DirectusRole } from './DirectusRole'
import { DirectusFile } from './DirectusFile'
import { DirectusPreset } from './DirectusPreset'
import { DirectusActivity } from './DirectusActivity'

/**
 * Directus 用户实体
 * 对应数据库表: directus_users
 */
@Entity('directus_users')
export class DirectusUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'first_name', type: 'varchar', length: 50, nullable: true })
  firstName?: string

  @Column({ name: 'last_name', type: 'varchar', length: 50, nullable: true })
  lastName?: string

  @Column({ type: 'varchar', length: 128 })
  email!: string

  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  password?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  title?: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'json', nullable: true })
  tags?: Record<string, any>

  @Column({ type: 'uuid', nullable: true })
  avatar?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  language?: string

  @Column({ name: 'tfa_secret', type: 'varchar', length: 255, select: false, nullable: true })
  tfaSecret?: string

  @Column({ type: 'varchar', length: 16 })
  status!: string

  @Column({ type: 'uuid', nullable: true })
  role?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  token?: string

  @Column({ name: 'last_access', type: 'timestamptz', nullable: true })
  lastAccess?: Date

  @Column({ name: 'last_page', type: 'varchar', length: 255, nullable: true })
  lastPage?: string

  @Column({ type: 'varchar', length: 128 })
  provider!: string

  @Column({ name: 'external_identifier', type: 'varchar', length: 255, nullable: true })
  externalIdentifier?: string

  @Column({ name: 'auth_data', type: 'json', nullable: true })
  authData?: Record<string, any>

  @Column({ name: 'email_notifications', type: 'boolean', nullable: true })
  emailNotifications?: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  appearance?: string

  @Column({ name: 'theme_dark', type: 'varchar', length: 255, nullable: true })
  themeDark?: string

  @Column({ name: 'theme_light', type: 'varchar', length: 255, nullable: true })
  themeLight?: string

  @Column({ name: 'theme_light_overrides', type: 'json', nullable: true })
  themeLightOverrides?: Record<string, any>

  @Column({ name: 'theme_dark_overrides', type: 'json', nullable: true })
  themeDarkOverrides?: Record<string, any>

  @Column({ name: 'text_direction', type: 'varchar', length: 255, nullable: true })
  textDirection?: string

  // ============ 关系 ============

  @ManyToOne(() => DirectusRole, { nullable: true })
  @JoinColumn({ name: 'role' })
  roleRelation?: DirectusRole

  @OneToMany(() => DirectusFile, (file) => file.uploadedByUser)
  uploadedFiles?: DirectusFile[]

  @OneToMany(() => DirectusPreset, (preset) => preset.userRelation)
  presets?: DirectusPreset[]

  @OneToMany(() => DirectusActivity, (activity) => activity.userRelation)
  activities?: DirectusActivity[]
}
