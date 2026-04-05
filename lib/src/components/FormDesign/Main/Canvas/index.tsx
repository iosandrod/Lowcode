import { computed, defineComponent } from 'vue'
import { FormRender, Icon } from '@/components'
import { useDesignInstance } from '@/hooks'
import { ns } from '@/utils'
import './index.scss'

export default defineComponent({
  setup() {
    const designInstance = useDesignInstance()!

    const currentKey = computed(() => designInstance.getCurrentKey())
    const hoverKey = computed(() => designInstance.getHoverKey())

    const handleCanvasMouseMove = () => {
      designInstance.setHoverKey('root')
    }

    const handleCanvasMouseLeave = () => {
      designInstance.setHoverKey('')
    }

    const handleCanvasClick = () => {
      designInstance.setCurrentKey('root')
    }

    return () => (
      <div class={ns('form-design-center')}>
        <div
          class="form-design-canvas"
          onMousemove={handleCanvasMouseMove}
          onMouseleave={handleCanvasMouseLeave}
          onClick={handleCanvasClick}
        >
          {(currentKey.value === 'root' || hoverKey.value === 'root') && (
            <div class="fd-form-title" style={{ opacity: currentKey.value === 'root' ? 1 : 0.5 }}>
              <Icon name="form" /> 表单
            </div>
          )}
          <FormRender
            class={[
              'fd-form',
              {
                hover: hoverKey.value === 'root',
                active: currentKey.value === 'root'
              }
            ]}
            schema={designInstance.getSchema()}
            design
          />
        </div>
      </div>
    )
  }
})
