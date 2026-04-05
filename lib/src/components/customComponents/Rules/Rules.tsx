import { computed, defineComponent } from 'vue'
import { FormRender } from '@/components'
import schema from './schema'

export default defineComponent({
  name: 'DesignRulesConfig',
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

    return () => <FormRender v-model={value.value} schema={schema} />
  }
})
