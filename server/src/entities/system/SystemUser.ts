import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { SystemRole } from './SystemRole'

/**
 * 系统用户 - 平台管理员
 * 存放在 system 数据库中
 */
@Entity('system_users')
export class SystemUser {
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
  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId?: string

  @Column({ type: 'jsonb', nullable: true })
  permissions?: Record<string, any> // 细粒度权限覆盖

  // SSO 支持
  @Column({ type: 'varchar', length: 128, nullable: true })
  provider?: string // local | github | google | ldap | ...

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // ============ 关系 ============
  @ManyToOne(() => SystemRole)
  @JoinColumn({ name: 'role_id' })
  role?: SystemRole

  // ============ 计算属性 ============
  get name(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || this.email
  }
}
