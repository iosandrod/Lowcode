import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm'

/**
 * 表单 Schema 实体
 * 存储租户设计的表单配置
 * 对应前端 FormSchema 类型
 */
@Entity('form_schemas')
export class FormSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  // ============ 基础信息 ============
  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: string // draft | published | archived

  // ============ Schema 定义 (JSON) ============
  // 对应前端 FormSchema 类型
  @Column({ type: 'jsonb' })
  schema!: Record<string, any>

  // ============ 版本管理 ============
  @Column({ type: 'int', default: 1 })
  version!: number

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date

  // ============ AI 相关 ============
  @Column({ name: 'ai_prompt', type: 'text', nullable: true })
  aiPrompt?: string

  @Column({ name: 'ai_generated_content', type: 'text', nullable: true })
  aiGeneratedContent?: string

  @Column({ name: 'ai_generated_at', type: 'timestamptz', nullable: true })
  aiGeneratedAt?: Date

  // ============ 分享 ============
  @Column({ type: 'varchar', length: 64, nullable: true })
  shareToken?: string

  @Column({ name: 'allow_share', type: 'boolean', default: true })
  allowShare!: boolean

  // ============ 多租户隔离 ============
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  // ============ 审计字段 ============
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // ============ 关系 ============
  @OneToMany(() => FormSchemaVersion, (v) => v.formSchema)
  versions?: FormSchemaVersion[]
}

/**
 * 表单 Schema 版本历史
 */
@Entity('form_schema_versions')
export class FormSchemaVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'schema_id', type: 'uuid' })
  schemaId!: string

  @Column({ type: 'int' })
  version!: number

  @Column({ type: 'jsonb' })
  schema!: Record<string, any>

  @Column({ type: 'text', nullable: true })
  changelog?: string

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  // ============ 关系 ============
  @ManyToOne(() => FormSchema, (s) => s.versions)
  @JoinColumn({ name: 'schema_id' })
  formSchema?: FormSchema
}

/**
 * 表单提交记录（可选，用于存储用户填写的表单数据）
 */
@Entity('form_submissions')
export class FormSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'schema_id', type: 'uuid' })
  schemaId!: string

  @Column({ name: 'schema_version', type: 'int' })
  schemaVersion!: number

  @Column({ type: 'jsonb' })
  data!: Record<string, any>

  @Column({ type: 'varchar', length: 50, default: 'submitted' })
  status!: string // submitted | approved | rejected

  @Column({ name: 'submitted_by', type: 'uuid', nullable: true })
  submittedBy?: string

  @Column({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress?: string

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  // ============ 关系 ============
  @ManyToOne(() => FormSchema)
  @JoinColumn({ name: 'schema_id' })
  formSchema?: FormSchema
}
