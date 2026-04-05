import { computed, defineComponent } from 'vue'
import { FormRender } from '@/components'
import { useDesignInstance } from '@/hooks'
import schema from './schema'

export default defineComponent({
  name: 'DesignBasicConfig',
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

    const designInstance = useDesignInstance()!

    const currentKey = () => designInstance.getCurrentKey()

    const rootSchema = () => {
      return designInstance.getSchema()
    }

    const currentNode = () => {
      return designInstance.getNodeByKey(currentKey())
    }

    return () => (
      <FormRender
        v-model={value.value}
        schema={schema}
        schemaContext={{ rootSchema: rootSchema(), currentNode: currentNode() }}
      />
    )
  }
})
