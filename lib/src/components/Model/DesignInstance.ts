import { cloneDeep, debounce } from 'lodash'
import type { FormElement, FormItemType, FormSchema, HistoryRecord, TemplateData } from '@/types'
import { repirJsonSchema } from '@/utils'
import { Base } from './Base'

interface DesignInstanceConfig {
  props: {
    modelValue: FormSchema
    schemaContext?: Record<string, unknown>
    templates?: TemplateData
    omitMenus?: string[]
  }
  emits: (event: string, ...args: any[]) => void
}

export class DesignInstance extends Base {
  props: DesignInstanceConfig['props']
  emits: DesignInstanceConfig['emits']
  currentKey = 'root'
  hoverKey = ''
  fullScreen = false
  history: HistoryRecord[] = []
  historyIndex = -1

  constructor(config: DesignInstanceConfig) {
    // debugger//
    super()
    this.props = config.props
    this.emits = config.emits
  }

  // ==================== Getters ====================
  getSchema(): FormSchema {
    return this.props.modelValue
  }

  getHistory(): HistoryRecord[] {
    return this.history
  }

  getHistoryIndex(): number {
    return this.historyIndex
  }

  getSchemaContext(): Record<string, unknown> {
    return this.props.schemaContext || {}
  }

  getTemplates(): TemplateData | undefined {
    return this.props.templates
  }

  getOmitMenus(): string[] {
    return this.props.omitMenus || []
  }

  getCurrentKey(): string {
    return this.currentKey
  }

  getHoverKey(): string {
    return this.hoverKey
  }

  getFullScreen(): boolean {
    return this.fullScreen
  }

  // ==================== Setters ====================
  setSchema(schema?: FormSchema): void {
    schema = schema || this.getSchema()
    this.props.modelValue = schema
    this.emits('update:modelValue', repirJsonSchema(schema))

    if (this.currentKey !== 'root') {
      this.currentKey = 'root'
    }
  }

  setCurrentKey(key: string): void {
    this.currentKey = key
  }

  setHoverKey(key: string): void {
    this.hoverKey = key
  }

  setHistoryIndex(index: number): void {
    const history = this.history
    if (index < -1 || index >= history.length) {
      console.warn('Invalid history index:', index)
      return
    }
    this.historyIndex = index
  }

  // ==================== Node Operations ====================
  private getNode(items: FormItemType[], designKey: string): FormItemType | null {
    return items.reduce<FormItemType | null>((acc, cur) => {
      if (cur.designKey === designKey) {
        return cur
      }
      if (cur.items) {
        const res = this.getNode(cur.items, designKey)
        if (res) return res
      }
      return acc
    }, null)
  }

  getNodeByKey(designKey: string): FormItemType | null {
    const schema = this.getSchema()
    if (!schema.items) return null
    return this.getNode(schema.items, designKey)
  }

  setNodeByKey(designKey: string, node: Partial<FormItemType>): void {
    const oldNode = this.getNodeByKey(designKey)
    if (oldNode) {
      Object.assign(oldNode, node)
    }
  }

  addItem(item: FormItemType): void {
    const schema = this.getSchema()
    this.setSchema({
      ...schema,
      items: schema.items ? [...schema.items, item] : [item]
    })
    this.debouncedRecordHistory('添加节点')
  }

  // ==================== Event Handlers ====================
  handleEmit(name: 'save' | 'add', params?: FormElement): void {
    this.emits(name, params)
  }

  handleClear(): void {
    this.setSchema({ items: [] })
    this.setCurrentKey('root')
    this.debouncedRecordHistory('清空表单')
  }

  handleHistoryBack(): void {
    const currentHistoryIndex = this.getHistoryIndex()
    if (currentHistoryIndex > -1) {
      this.historyIndex--
      const record = this.getHistory()[this.historyIndex]
      const newSchema = record ? record.schema : {}
      this.setSchema(cloneDeep(newSchema))
    }
  }

  handleHistoryForward(): void {
    const currentHistoryIndex = this.getHistoryIndex()
    const currentHistory = this.getHistory()

    if (currentHistoryIndex < currentHistory.length - 1) {
      this.historyIndex++
      this.setSchema(cloneDeep(currentHistory[this.historyIndex].schema))
    }
  }

  handleToggleFullScreen(): void {
    this.fullScreen = !this.fullScreen
    if (this.fullScreen) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // ==================== History ====================
  recordHistory(description: string = '修改'): void {
    const currentHistoryIndex = this.historyIndex
    const currentHistory = this.getHistory()

    if (currentHistoryIndex < currentHistory.length - 1) {
      this.history = currentHistory.slice(0, currentHistoryIndex + 1)
    }
    this.history.push({
      schema: cloneDeep(this.getSchema()),
      description,
      timestamp: Date.now()
    })
    this.historyIndex = this.history.length - 1
  }

  // Debounced version for external use
  debouncedRecordHistory = debounce((description?: string) => {
    this.recordHistory(description)
  }, 700)//
}
