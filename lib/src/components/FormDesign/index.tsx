import { cloneDeep, debounce, isEqual } from 'lodash'
import {
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  provide,
  reactive,
  ref,
  useTemplateRef,
  watch
} from 'vue'
import { $designInstance } from '@/symbol'
import type {
  DesignInstance,
  FormElement,
  FormItemType,
  FormSchema,
  HistoryRecord,
  TemplateData
} from '@/types'
import { ns, repirJsonSchema } from '@/utils'
import Main from './Main/index.tsx'
import SideBar from './SideBar/index.vue'
import './index.scss'

let initJsonSchema: FormSchema = {}

export default defineComponent({
  name: 'FormDesign',
  inheritAttrs: false,
  props: {
    modelValue: {
      type: Object as () => FormSchema,
      default: () => reactive(initJsonSchema)
    },
    schemaContext: {
      type: Object as () => Record<string, unknown>,
      default: () => ({})
    },
    templates: {
      type: Array as () => TemplateData,
      default: () => []
    },
    omitMenus: {
      type: Array as () => string[],
      default: () => []
    }
  },
  emits: ['update:modelValue', 'save', 'add'],
  setup(props, { attrs, emit, expose }) {
    const formDesignWrapper = useTemplateRef<HTMLDivElement>('formDesignWrapper')

    const currentKey = ref('root')
    const hoverKey = ref('')
    const fullScreen = ref(false)
    const history = ref<HistoryRecord[]>([])
    const historyIndex = ref(-1)

    const getSchema = () => props.modelValue
    const getHistory = () => history.value
    const getHistoryIndex = () => historyIndex.value

    const setSchema: DesignInstance['setSchema'] = (schema = getSchema()) => {
      emit('update:modelValue', repirJsonSchema(schema))

      if (currentKey.value !== 'root') {
        currentKey.value = 'root'
      }
    }

    const setCurrentKey = (key: string) => {
      currentKey.value = key
    }

    const setHoverKey = (key: string) => {
      hoverKey.value = key
    }

    const setHistoryIndex = (index: number) => {
      if (index < -1 || index >= getHistory().length) {
        console.warn('Invalid history index:', index)
        return
      }
      historyIndex.value = index
    }

    const recordHistory = debounce((description: string = '修改') => {
      const currentHistoryIndex = getHistoryIndex()
      const currentHistory = getHistory()

      if (currentHistoryIndex < currentHistory.length - 1) {
        history.value = currentHistory.slice(0, currentHistoryIndex + 1)
      }
      history.value.push({
        schema: cloneDeep(getSchema()),
        description,
        timestamp: Date.now()
      })
      historyIndex.value = history.value.length - 1
    }, 700)

    const handleHistoryBack = () => {
      const currentHistoryIndex = getHistoryIndex()
      if (currentHistoryIndex > -1) {
        historyIndex.value--
        const record = getHistory()[historyIndex.value]
        const newSchema = record ? record.schema : initJsonSchema
        setSchema(cloneDeep(newSchema))
      }
    }

    const handleHistoryForward = () => {
      const currentHistoryIndex = getHistoryIndex()
      const currentHistory = getHistory()

      if (currentHistoryIndex < currentHistory.length - 1) {
        historyIndex.value++
        setSchema(cloneDeep(currentHistory[historyIndex.value].schema))
      }
    }

    const handleFullscreenChange = () => {
      fullScreen.value = !!document.fullscreenElement
    }

    const getNode = (items: FormItemType[], designKey: string): FormItemType | null => {
      return items.reduce<FormItemType | null>((acc, cur) => {
        if (cur.designKey === designKey) {
          return cur
        }
        if (cur.items) {
          const res = getNode(cur.items, designKey)
          if (res) return res
        }

        return acc
      }, null)
    }

    const getNodeByKey = (designKey: string): FormItemType | null => {
      const schema = getSchema()

      if (!schema.items) return null

      return getNode(schema.items, designKey)
    }

    const setNodeByKey: DesignInstance['setNodeByKey'] = (designKey, node) => {
      const oldNode = getNodeByKey(designKey)
      if (oldNode) {
        Object.assign(oldNode, node)
      }
    }

    const addItem = (item: FormItemType) => {
      const schema = getSchema()

      setSchema({
        ...schema,
        items: schema.items ? [...schema.items, item] : [item]
      })
      recordHistory('添加节点')
    }

    watch(fullScreen, (val) => {
      if (val) {
        formDesignWrapper.value?.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    })

    onBeforeMount(() => {
      let schema = repirJsonSchema(getSchema())
      setSchema(schema)

      if (!isEqual(schema, initJsonSchema)) {
        initJsonSchema = cloneDeep(schema)
      }

      document.addEventListener('fullscreenchange', handleFullscreenChange)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    })

    const handleEmit = (name: 'save' | 'add', params?: FormElement) => {
      emit(name, params)
    }

    const handleClear = () => {
      setSchema({ items: [] })
      setCurrentKey('root')
      recordHistory('清空表单')
    }

    const handleToggleFullScreen = () => {
      fullScreen.value = !fullScreen.value
    }

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

    provide($designInstance, instance)

    expose(instance)

    return () => (
      <div class={ns('form-design')} {...attrs}>
        <SideBar />
        <Main />
      </div>
    )
  }
})
