import { computed, defineComponent, h } from 'vue'
import { ElementIcon, Icon, Tree } from '@/components'
import { useDesignInstance, useElements } from '@/hooks'
import type { FormItemType } from '@/types'
import { ns } from '@/utils'
import './Outline.scss'

// Convert Vue Outline.vue to TSX component
export default defineComponent({
  name: 'OutlinePanel',
  setup() {
    const designInstance = useDesignInstance()
    const elements = useElements()

    // 递归构建树形数据
    const buildTreeData = (items: FormItemType[] = []): any[] => {
      return items.map((item) => {
        const element = (elements as any)[item.component]
        const node: any = {
          label: item.label || element?.title || item.component,
          designKey: item.designKey || item.name,
          icon: element?.icon || 'component',
          component: item.component
        }

        // 如果有子节点, 递归处理
        if (item.items && item.items.length > 0) {
          node.children = buildTreeData(item.items)
        }

        return node
      })
    }

    const treeData = computed(() => {
      if (!designInstance) return []

      const schema = designInstance.getSchema()

      // 根节点
      const rootNode: any = {
        label: '表单',
        designKey: 'root',
        icon: h(Icon, { name: 'form' }),
        children: buildTreeData(schema.items)
      }

      return [rootNode]
    })

    const currentNodeKey = computed(() => {
      return designInstance?.getCurrentKey() || 'root'
    })

    const handleNodeClick = (data: any) => {
      if (designInstance) {
        designInstance.setCurrentKey(data.designKey)
      }
    }

    return () => (
      <div class={ns('outline')}>
        <Tree
          data={treeData.value}
          nodeKey="designKey"
          currentKey={currentNodeKey.value}
          defaultExpandAll={true}
          expandOnClickNode={false}
          onNode-click={handleNodeClick}
        >
          {({ data }: any) => (
            <div class="tree-node">
              <span class="node-icon">
                <ElementIcon icon={data.icon} />
              </span>
              <span class="node-label">{data.label}</span>
            </div>
          )}
        </Tree>
      </div>
    )
  }
})
