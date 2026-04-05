import { computed, defineComponent } from 'vue'
import { FormRender } from '@/components'
import type { FormSchema } from '@/types'
import schema from './schema'

export default defineComponent({
  name: 'DesignOptionsConfig',
  props: {
    modelValue: {
      type: Object as () => FormSchema,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const value = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v)
    })

    return () => <FormRender v-model={value.value} schema={schema} />
  }
})
