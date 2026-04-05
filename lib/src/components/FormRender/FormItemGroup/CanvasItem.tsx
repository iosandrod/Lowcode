import { computed, defineComponent, ref } from 'vue'
import { Icon } from '@/components'
import { useDesignInstance, useElements } from '@/hooks'
import type { FormItemType } from '@/types'
import { copyItems, ns, recursionDelete } from '@/utils'
import ElementIcon from '../../ElementIcon'
import FormItem from './FormItem'
import './CanvasItem.scss'

export default defineComponent({
  name: 'CanvasItem',
  props: {
    data: {
      type: Object as () => FormItemType,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const designInstance = useDesignInstance()!
    const elements = useElements()

    const currentKey = computed(() => designInstance.getCurrentKey())
    const hoverKey = computed(() => designInstance.getHoverKey())

    const config = computed(() => {
      return (
        elements[props.data.component] || {
          title: '未知组件',
          icon: 'help'
        }
      )
    })

    const canvasItemClass = computed(() => {
      return {
        [ns('canvas-item')]: true,
        active: props.data.designKey === currentKey.value,
        hover: props.data.designKey === hoverKey.value,
        mask: props.data.designKey === hoverKey.value && !props.data.items
      }
    })

    const handleHoverEnter = () => {
      if (props.data.designKey) {
        designInstance.setHoverKey(props.data.designKey)
      }
    }

    const handleHoverLeave = () => {
      designInstance.setHoverKey('')
    }

    const handleSelect = (element: FormItemType) => {
      designInstance.setCurrentKey(element.designKey!)
    }

    const rightBottomActions = [
      {
        icon: 'move',
        name: 'move-btn'
      },
      {
        icon: 'copy',
        name: 'copy-btn',
        handle: (element: FormItemType) => {
          const schema = designInstance.getSchema()
          const newList = copyItems(schema.items!, element.designKey!)
          designInstance.setSchema({ ...schema, items: newList })
          designInstance.recordHistory(`复制表单项-${element.label || element.name}`)
        }
      },
      {
        icon: 'delete',
        name: 'delete-btn',
        handle: (element: FormItemType) => {
          const schema = designInstance.getSchema()
          const newList = recursionDelete(
            schema.items!,
            (item: any) => item.designKey !== element.designKey
          )
          designInstance.setSchema({ ...schema, items: newList })
          designInstance.recordHistory(`删除表单项-${element.label || element.name}`)
        }
      }
    ]

    return () => (
      <div
        class={[canvasItemClass.value, props.data.designKey]}
        onClick={(e) => {
          e.stopPropagation()
          handleSelect(props.data)
        }}
        onMousemove={(e) => {
          e.stopPropagation()
          handleHoverEnter()
        }}
        onMouseleave={(e) => {
          e.stopPropagation()
          handleHoverLeave()
        }}
      >
        <div class="actions">
          <div class="componentName">
            <ElementIcon icon={config.value.icon} />
            {config.value.title}
          </div>
          {rightBottomActions.map(({ icon, handle, name }) => (
            <div
              class={['actions-item', name]}
              key={icon}
              onClick={(e) => {
                e.stopPropagation()
                handle && handle(props.data)
              }}
            >
              <Icon name={icon} />
            </div>
          ))}
        </div>

        <FormItem {...props.data} componentProps={props.data.componentProps} />
      </div>
    )
  }
})
