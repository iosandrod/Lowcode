import type {
  FormItemType,
  FormSchema,
  HistoryRecord,
  DesignInstance as IDesignInstance,
  TemplateData
} from '@/types'
import { Base } from './Base'
import { repirJsonSchema } from '@/utils'
import { cloneDeep } from 'lodash'
import { debounce } from './Decoration/debounce'
/* 
 const instance: DesignInstance = {
      getSchemaContext: () => props.schemaContext || {},
      getTemplates: () => props.templates,
      getOmitMenus: () => props.omitMenus || [],
      getCurrentKey: () => currentKey.value,
      getHoverKey: () => hoverKey.value,
      getFullScreen: () => fullScreen.value,
      getHistory,
      getHistoryIndex,
      getSchema,
      setSchema,
      setCurrentKey,
      setHoverKey,
      setHistoryIndex,
      recordHistory,
      handleEmit,
      handleClear,
      handleHistoryBack,
      handleHistoryForward,
      handleToggleFullScreen,
      getNodeByKey,
      setNodeByKey,
      addItem
    }

*/
export class DesignInstance extends Base {//
  props: any
  emits: any
  currentKey = 'root'
  hoverKey = ''
  fullScreen = false
  history: HistoryRecord[] = []
  historyIndex = -1
  constructor(config: any) {
    super()//
    this.props = config.props
    this.emits = config.emits
  }
  getSchema() {
    return this.props.modelValue
  }
  getHistory() {
    return this.history
  }
  getHistoryIndex() {
    return this.historyIndex
  }
  getSchemaContext() {
    return this.props.schemaContext || {}
  }
  getTemplates() {
    return this.props.templates
  }
  getOmitMenus() {
    return this.props.omitMenus || []
  }
  getCurrentKey() {
    return this.currentKey
  }
  getHoverKey() {
    return this.hoverKey
  }
  getFullScreen() {
    return this.fullScreen
  }
  setSchema(schema: FormSchema) {
    schema = schema || this.getSchema()
    this.props.modelValue = schema
    this.emits('update:modelValue', repirJsonSchema(schema))

    if (this.currentKey !== 'root') {
      this.currentKey = 'root'
    }
  }
  setCurrentKey(key: string) {
    this.currentKey = key//装饰
  }
  setHoverKey(key: string) {
    this.hoverKey = key
  }
  setHistoryIndex(index: number) {
    let history = this.history
    if (index < -1 || index >= history.length) {
      console.warn('Invalid history index:', index)
      return
    }
    this.historyIndex = index
  }
  @debounce(700)
  recordHistory(description: string = '修改') {
    let currentHistoryIndex = this.historyIndex
    let currentHistory = this.getHistory()
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
}
