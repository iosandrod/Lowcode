import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 * Directus 策略实体 (Policies)
 * 对应数据库表: directus_policies
 */
@Entity('directus_policies')
export class DirectusPolicy {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'json', nullable: true })
  ipAccess?: string[]

  @Column({ type: 'boolean', default: false })
  enforceTfa!: boolean

  @Column({ name: 'admin_access', type: 'boolean', default: false })
  adminAccess!: boolean

  @Column({ name: 'appAccess', type: 'boolean', default: true })
  appAccess!: boolean

  @CreateDateColumn({ name: 'created_on' })
  createdOn!: Date

  @UpdateDateColumn({ name: 'updated_on' })
  updatedOn!: Date
}
