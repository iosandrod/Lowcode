import { computed, defineComponent } from 'vue'
import { useFormInstance } from '@/hooks'
import type { FormItemType } from '@/types'
import CanvasGroup from './CanvasGroup'
import FormItem from './FormItem'

export default defineComponent({
  name: 'FormItemGroup',
  props: {
    list: {
      type: Array as () => FormItemType[],
      required: true
    },
    designKey: {
      type: String,
      default: undefined
    }
  },
  setup(props) {
    const formInstance = useFormInstance()

    const design = computed(() => formInstance?.getDesign() ?? false)

    return () => {
      if (design.value) {
        return <CanvasGroup designKey={props.designKey} />
      }

      return (
        <div>
          {props.list.map((item) => (
            <FormItem {...item} />
          ))}
        </div>
      )
    }
  }
})
