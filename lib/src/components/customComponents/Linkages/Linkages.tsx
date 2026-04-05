import { computed, defineComponent } from 'vue'
import { FormRender } from '@/components'
import { useDesignInstance } from '@/hooks'
import type { FormItemType } from '@/types'
import schema from './schema'

export default defineComponent({
  name: 'DesignLinkagesConfig',
  props: {
    modelValue: {
      type: [Object, Array],
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const value = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v)
    })

    const designInstance = useDesignInstance()

    const nodeOptions = () => {
      if (!designInstance) return []

      const rootNodes = designInstance.getSchema().items || []

      const options: { label: string; value: string }[] = []

      const getNodes = (nodes: FormItemType[]) => {
        nodes.forEach((node) => {
          options.push({
            label: node.label || node.name,
            value: node.name
          })

          if (node.items) {
            getNodes(node.items)
          }
        })
      }

      getNodes(rootNodes)

      return options
    }

    return () => (
      <FormRender
        v-model={value.value}
        schema={schema}
        schemaContext={{ nodeOptions: nodeOptions() }}
      />
    )
  }
})
