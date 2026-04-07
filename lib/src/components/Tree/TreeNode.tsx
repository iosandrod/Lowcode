import { computed, defineComponent, getCurrentInstance, ref, watch } from 'vue'
import { Icon } from '@/components'
import { ns } from '@/utils'

export default defineComponent({
  name: 'TreeNode',
  props: {
    node: { type: Object as () => any, required: true },
    nodeKey: { type: String, required: true },
    currentKey: { type: [String, Number] as unknown as () => string | number, default: undefined },
    level: { type: Number, required: true },
    defaultExpandAll: { type: Boolean, required: true },
    expandOnClickNode: { type: Boolean, required: true }
  },
  emits: ['node-click'],
  setup(props, { emit, slots }) {
    const expanded = ref(props.defaultExpandAll)

    const hasChildren = computed(() => {
      return props.node.children && props.node.children.length > 0
    })

    const isActive = computed(() => {
      return props.currentKey === props.node[props.nodeKey]
    })

    const toggleExpand = () => {
      if (hasChildren.value) {
        expanded.value = !expanded.value
      }
    }

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation()
      if (props.expandOnClickNode && hasChildren.value) {
        toggleExpand()
      }
      emit('node-click', props.node)
    }

    const handleExpandIconClick = (e: MouseEvent) => {
      e.stopPropagation()
      toggleExpand()
    }

    watch(
      () => props.defaultExpandAll,
      (val) => {
        expanded.value = val
      }
    )

    const nodeArr = computed(() => {
      return Array.isArray(props.node.children) ? props.node.children : []
    })

    // Get current instance for recursive reference
    const instance = getCurrentInstance()

    return () => {
      const { node, nodeKey, currentKey, level, defaultExpandAll, expandOnClickNode } = props

      // Recursive component reference - use instance.type cast as any to avoid TS error
      const TreeNodeComp = instance?.type as any

      const childNodes = nodeArr.value.map((child: any) => (
        <TreeNodeComp
          node={child}
          nodeKey={nodeKey}
          currentKey={currentKey}
          level={level + 1}
          defaultExpandAll={defaultExpandAll}
          expandOnClickNode={expandOnClickNode}
          onNode-click={(n: any) => emit('node-click', n)}
        >
          {slots.default?.({ node, data: node })}
        </TreeNodeComp>
      ))

      return (
        <div class={ns('tree-node-wrapper')}>
          <div
            class={[
              ns('tree-node'),
              { [ns('tree-node-active')]: isActive.value },
              { [ns('tree-node-is-leaf')]: !hasChildren.value }
            ]}
            style={{ paddingLeft: `${level * 18 + 8}px` }}
            onClick={handleClick}
          >
            {hasChildren.value && (
              <span
                class={[ns('tree-node-expand-icon'), { expanded: expanded.value }]}
                onClick={handleExpandIconClick}
              >
                <Icon name="arrowDown" />
              </span>
            )}
            <div class={ns('tree-node-content')}>{slots.default?.({ node, data: node })}</div>
          </div>
          {hasChildren.value && (
            <div
              class={ns('tree-node-children')}
              style={{ display: expanded.value ? undefined : 'none' }}
            >
              {childNodes}
            </div>
          )}
        </div>
      )
    }
  }
})
