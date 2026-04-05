import { computed, defineComponent, Fragment } from 'vue'
import { useDesignInstance } from '@/hooks'
import type { FormItemType } from '@/types'
import { ns } from '@/utils'
import AttrEdit from './Attr'
import './index.scss'

export default defineComponent({
  name: 'AttrPanel',
  setup() {
    const designInstance = useDesignInstance()!
    const currentKey = computed(() => designInstance.getCurrentKey())

    const breadcrumbPath = computed(() => {
      if (currentKey.value === 'root') {
        return []
      }

      const path: FormItemType[] = []
      const schema = designInstance.getSchema()

      const findPath = (
        items: FormItemType[],
        targetKey: string,
        currentPath: FormItemType[]
      ): boolean => {
        for (const item of items) {
          const newPath = [...currentPath, item]

          if (item.designKey === targetKey) {
            path.push(...newPath)
            return true
          }

          if (item.items && item.items.length > 0) {
            if (findPath(item.items, targetKey, newPath)) {
              return true
            }
          }
        }
        return false
      }

      if (schema.items) {
        findPath(schema.items, currentKey.value, [])
      }

      return path
    })

    return () => (
      <div class={ns('form-design-right')}>
        <div class="breadcrumb">
          <span
            class="breadcrumb-item"
            onClick={() => designInstance.setCurrentKey('root')}
            onMouseenter={() => designInstance.setHoverKey('root')}
          >
            表单
          </span>
          {breadcrumbPath.value.map((node) => [
            <span class="breadcrumb-separator" key={`sep-${node.designKey}`}>
              &gt;
            </span>,
            <span
              class="breadcrumb-item"
              key={node.designKey}
              onClick={() => designInstance.setCurrentKey(node.designKey!)}
              onMouseenter={() => designInstance.setHoverKey(node.designKey!)}
            >
              {node.label || node.name}
            </span>
          ])}
        </div>
        <AttrEdit />
      </div>
    )
  }
})
