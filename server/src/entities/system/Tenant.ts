import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 * 租户元信息 - 存放在 system 数据库
 * 每行记录代表一个租户，包含租户数据库连接信息
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string

  // 租户独立数据库名称
  @Column({ name: 'database_name', type: 'varchar', length: 100 })
  databaseName!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo?: string

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string // active | inactive | suspended | trial

  // 配额管理
  @Column({ name: 'max_users', type: 'int', default: 10 })
  maxUsers!: number

  @Column({ name: 'max_forms', type: 'int', default: 100 })
  maxForms!: number

  // 订阅信息
  @Column({ type: 'varchar', length: 50, nullable: true })
  plan?: string

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date

  // 租户配置 (JSON)
  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, any>

  // 域名绑定
  @Column({ type: 'varchar', length: 255, nullable: true })
  domain?: string

  // 管理员用户 ID (指向 system_users)
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
