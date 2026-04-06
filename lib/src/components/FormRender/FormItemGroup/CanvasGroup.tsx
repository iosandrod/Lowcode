import { computed, defineComponent, ref } from 'vue'
import Draggable from 'vuedraggable-es-fix'
import { Icon } from '@/components'
import { useDesignInstance } from '@/hooks'
import { ns } from '@/utils'
import CanvasItem from './CanvasItem'
import './CanvasGroup.scss'

export default defineComponent({
  name: 'CanvasGroup',
  props: {
    designKey: { type: String, default: undefined },
    style: { type: [String, Object], default: undefined },
    class: { type: String, default: undefined },
    emptyText: { type: String, default: '请拖入子字段' },
    emptySize: { type: Number, default: 12 }
  },
  setup(props) {
    const scrollContainer = ref<HTMLElement>()
    const designInstance = useDesignInstance()!

    const list = computed(() => {
      if (!designInstance || !props.designKey) return []

      if (props.designKey === 'root') {
        const rootList = designInstance.getSchema().items || []

        if (!rootList) {
          designInstance.setSchema({
            ...designInstance.getSchema(),
            items: []
          })
          designInstance.recordHistory('补充items数据')
        }

        return rootList || []
      }
      return designInstance.getNodeByKey(props.designKey)?.items || []
    })

    const onAdd = (e: Record<string, any>) => {
      const source = e.item._underlying_vm_

      // SortableJS模式：vuedraggable 已经直接修改了 list.value (即 schema.items)
      // 所以不需要再调用 addItem，只需要设置当前选中和发送事件
      designInstance.setCurrentKey(source.designKey)
      designInstance.handleEmit('add', source)
    }

    const onUpdate = () => {
      designInstance.recordHistory('调整组件顺序')
    }

    return () => (
      <div
        ref={scrollContainer}
        class={ns('canvas-group')}
        style={{ overflowY: list.value.length ? 'auto' : 'hidden' }}
      >
        {!list.value.length && (
          <div class={ns('canvas-group-empty')} style={{ fontSize: props.emptySize + 'px' }}>
            <div class={ns('canvas-group-empty-ico')}>
              <Icon name="add" />
            </div>
            <p>{props.emptyText}</p>
          </div>
        )}

        <Draggable
          list={list.value}
          group="formDesign"
          itemKey="name"
          ghostClass={ns('canvas-group-ghost')}
          class={[ns('canvas-group-draggable'), props.class]}
          style={props.style}
          animation={300}
          handle=".move-btn"
          scroll={scrollContainer.value}
          scrollSensitivity={100}
          scrollSpeed={20}
          bubbleScroll={true}
          onAdd={onAdd}
          onUpdate={onUpdate}
          v-slots={{
            item: ({ element: child, index }: { element: any; index: number }) =>
              child.designKey ? <CanvasItem data={child} index={index} /> : null
          }}
        />
      </div>
    )
  }
})
