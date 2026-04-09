import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 * 租户用户 - 存放在各租户独立数据库中
 */
@Entity('users')
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'first_name', type: 'varchar', length: 50, nullable: true })
  firstName?: string

  @Column({ name: 'last_name', type: 'varchar', length: 50, nullable: true })
  lastName?: string

  @Column({ type: 'varchar', length: 128, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  password?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: string // active | inactive | suspended

  // 角色
  @Column({ type: 'varchar', length: 50, default: 'member' })
  role!: string // admin | editor | member | viewer

  @Column({ type: 'jsonb', nullable: true })
  permissions?: Record<string, any> // 细粒度权限

  // SSO 支持
  @Column({ type: 'varchar', length: 128, nullable: true })
  provider?: string

  @Column({ name: 'external_id', type: 'varchar', length: 255, nullable: true })
  externalId?: string

  @Column({ name: 'auth_data', type: 'jsonb', nullable: true })
  authData?: Record<string, any>

  // Token
  @Column({ type: 'varchar', length: 64, nullable: true })
  token?: string

  @Column({ name: 'token_last_at', type: 'timestamptz', nullable: true })
  tokenLastAt?: Date

  @Column({ name: 'reset_token', type: 'varchar', length: 64, nullable: true })
  resetToken?: string

  @Column({ name: 'reset_at', type: 'timestamptz', nullable: true })
  resetAt?: Date

  // 审计字段
  @Column({ name: 'last_access', type: 'timestamptz', nullable: true })
  lastAccess?: Date

  @Column({ name: 'last_page', type: 'varchar', length: 255, nullable: true })
  lastPage?: string

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // ============ 计算属性 ============
  get name(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || this.email
  }
}
