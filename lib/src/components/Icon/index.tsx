import { computed, defineComponent } from 'vue'
import * as icons from './icons'
import './index.scss'

export default defineComponent({
  name: 'IconRender',
  props: {
    name: { type: String, required: true }
  },
  setup(props) {
    const iconComponent = computed(() => (icons as Record<string, any>)[props.name])

    return () => {
      const IconComp = iconComponent.value
      if (!IconComp) return null
      return <IconComp />
    }
  }
})
