import { computed, defineComponent, useSlots } from 'vue'
import { ns } from '@/utils'
import TreeNode from './TreeNode'

export default defineComponent({
  name: 'Tree',
  props: {
    data: {
      type: Array as () => any[],
      default: () => []
    },
    nodeKey: {
      type: String,
      default: 'id'
    },
    currentKey: {
      type: [String, Number] as () => string | number,
      default: undefined
    },
    defaultExpandAll: {
      type: Boolean,
      default: false
    },
    expandOnClickNode: {
      type: Boolean,
      default: true
    }
  },
  emits: ['node-click', 'update:currentKey'],
  setup(props, { emit, slots }) {
    const handleNodeClick = (node: any) => {
      emit('update:currentKey', node[props.nodeKey])
      emit('node-click', node)
    }

    return () => (
      <div class={ns('tree')}>
        {props.data.map((node) => (
          <TreeNode
            key={node[props.nodeKey]}
            node={node}
            nodeKey={props.nodeKey}
            currentKey={props.currentKey}
            level={0}
            defaultExpandAll={props.defaultExpandAll}
            expandOnClickNode={props.expandOnClickNode}
            onNode-click={handleNodeClick}
          >
            {{ default: (slotProps: { node: any; data: any }) => slots.default?.(slotProps) }}
          </TreeNode>
        ))}
      </div>
    )
  }
})
