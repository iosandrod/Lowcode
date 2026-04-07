import { cloneDeep, isEqual } from 'lodash'
import {
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  provide,
  reactive,
  useTemplateRef,
  watch
} from 'vue'
import { $designInstance } from '@/symbol'
import type { FormSchema, TemplateData } from '@/types'
import { ns, repirJsonSchema } from '@/utils'
import { DesignInstance as DesignInstanceImpl } from '../Model/DesignInstance'
import Main from './Main/index'
import { default as SideBar } from './SideBar/index'

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

    const _instance = new DesignInstanceImpl({
      props,
      emits: emit
    })

    const handleFullscreenChange = () => {
      _instance.fullScreen = !!document.fullscreenElement
    }

    watch(
      () => _instance.fullScreen,
      (val) => {
        if (val) {
          formDesignWrapper.value?.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    )

    onBeforeMount(() => {
      let schema = repirJsonSchema(_instance.getSchema())
      _instance.setSchema(schema)

      if (!isEqual(schema, initJsonSchema)) {
        initJsonSchema = cloneDeep(schema)
      }

      document.addEventListener('fullscreenchange', handleFullscreenChange)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    })

    provide($designInstance, _instance)

    expose(_instance)

    return () => (
      <div style={{ display: 'flex' }} class={ns('form-design')} {...attrs}>
        <SideBar />
        <Main />
      </div>
    )
  }
})
