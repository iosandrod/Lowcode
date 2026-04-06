import { computed, defineComponent, h, ref, useSlots, watch } from 'vue'
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
    const $slots = useSlots()

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

    watch(
      () => props.defaultExpandAll,
      (val) => {
        expanded.value = val
      }
    )

    return () => {
      const nodeArr = Array.isArray(props.node.children) ? props.node.children : []
      const childNodes = nodeArr.map((child: any) =>
        h(
          'TreeNode' as any,
          {
            key: child[props.nodeKey],
            node: child,
            nodeKey: props.nodeKey,
            currentKey: props.currentKey,
            level: props.level + 1,
            defaultExpandAll: props.defaultExpandAll,
            expandOnClickNode: props.expandOnClickNode,
            'onNode-click': (node: any) => emit('node-click', node)
          },
          {
            default: () => $slots.default?.({ node: props.node, data: props.node })
          }
        )
      )

      return h('div', { class: ns('tree-node-wrapper') }, [
        h(
          'div',
          {
            class: [
              ns('tree-node'),
              { [ns('tree-node-active')]: isActive.value },
              { [ns('tree-node-is-leaf')]: !hasChildren.value }
            ],
            style: { paddingLeft: `${props.level * 18 + 8}px` },
            onClick: handleClick
          },
          [
            hasChildren.value &&
              h(
                'span',
                {
                  class: [ns('tree-node-expand-icon'), { expanded: expanded.value }],
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation()
                    toggleExpand()
                  }
                },
                [h(Icon, { name: 'arrowDown' })]
              ),
            h('div', { class: ns('tree-node-content') }, [
              $slots.default?.({ node: props.node, data: props.node })
            ])
          ].filter(Boolean)
        ),
        hasChildren.value &&
          h(
            'div',
            {
              class: ns('tree-node-children'),
              style: { display: expanded.value ? undefined : 'none' }
            },
            childNodes
          )
      ])
    }
  }
})
