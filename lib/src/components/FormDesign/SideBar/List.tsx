import { cloneDeep } from 'lodash'
import { computed, defineComponent, h, ref } from 'vue'
import Draggable from 'vuedraggable-es-fix'
import { ElementIcon, Icon } from '@/components'
import { useDesignInstance, useElements, useUI } from '@/hooks'
import type { FormElement, FormItemType } from '@/types'
import { generateDesignKey, generateName, ns, repirNode } from '@/utils'
import parseMenus from './menus'
import './index.scss'
import './List.scss'

// Component name: ComponentList

export default defineComponent({
  name: 'ComponentList',
  props: {
    // No external props for this internal, keep API explicit if needed in future
  },
  setup() {
    const { Input } = useUI() as any

    const designInstance = useDesignInstance()!
    const elements = useElements()

    const q = ref('')

    const menus = computed(() => parseMenus({ elements, omits: designInstance.getOmitMenus() }))

    // 搜索过滤后的组件列表
    const filteredComponents = computed(() => {
      const query = q.value.trim().toLowerCase()
      if (!query) return [] as any[]

      const allComponents: any[] = []
      menus.value.forEach((menu) => {
        menu.children.forEach((child) => {
          // 支持中文标题和英文组件名搜索
          const title = child.title.toLowerCase()
          const component = child.component.toLowerCase()
          if (title.includes(query) || component.includes(query)) {
            allComponents.push(child)
          }
        })
      })

      return allComponents
    })

    const onClone = (source: FormElement) => {
      const parse: FormItemType = {
        component: source.component,
        designKey: generateDesignKey(),
        name: generateName()
      }

      if (source.type === 'basic') {
        parse.label = source.title
      }

      if (source.attrSchema?.initialValues) {
        Object.assign(parse, source.attrSchema.initialValues)
      }

      return cloneDeep(repirNode(parse))
    }

    const handleDbClick = (element: FormElement) => {
      const item = onClone(element)
      designInstance.addItem(item)
    }

    const DraggableComp: any = Draggable
    return () => {
      // 搜索框
      const SearchBox = (
        <Input
          class="responsive-input"
          placeholder="搜索组件"
          clearable
          modelValue={q.value}
          onUpdate:modelValue={(val: string) => (q.value = val)}
          v-slots={{ prefix: () => <Icon name="search" /> }}
        />
      )

      return (
        <div class={ns('components')}>
          {SearchBox}
          {/* 搜索结果直接展示 */}
          {q.value.trim() && (
            <div class={ns('search-result')}>
              {filteredComponents.value.length > 0 ? (
                <DraggableComp
                  list={filteredComponents.value}
                  class={ns('menu-list')}
                  group="formDesign"
                  sort={false}
                  ghostClass={ns('menu-list-ghost')}
                  dragClass={ns('menu-list-drag')}
                  fallbackClass={ns('menu-list-fallback')}
                  itemKey="designKey"
                  clone={onClone}
                >
                  {{
                    item: ({ element }: { element: any; index: number }) => (
                      <li
                        class={[ns('menu-list-item'), `menu-${element.component}`] as any}
                        onDblclick={() => handleDbClick(element)}
                      >
                        <div class={ns('menu-list-item-ico')}>
                          <ElementIcon icon={element.icon} />
                        </div>
                        <div class={ns('menu-list-item-name')}>{element.title}</div>
                      </li>
                    )
                  }}
                </DraggableComp>
              ) : (
                <div class={ns('no-result')}>暂无匹配的组件</div>
              )}
            </div>
          )}

          {/* 无搜索时使用折叠面板 */}
          {!q.value.trim() && (
            <div>
              {menus.value.map((menu: any) => {
                const { title, children } = menu
                return (
                  <div key={title} title={title}>
                    <div class={ns('menu-list-title')}>{title}</div>
                    <DraggableComp
                      list={children}
                      class={ns('menu-list')}
                      group="formDesign"
                      sort={false}
                      ghostClass={ns('menu-list-ghost')}
                      dragClass={ns('menu-list-drag')}
                      fallbackClass={ns('menu-list-fallback')}
                      itemKey="designKey"
                      clone={onClone}
                      v-slots={{
                        item: ({ element }: { element: any; index: number }) => (
                          <li
                            class={[ns('menu-list-item'), `menu-${element.component}`] as any}
                            onDblclick={() => handleDbClick(element)}
                          >
                            <div class={ns('menu-list-item-ico')}>
                              <ElementIcon icon={element.icon} />
                            </div>
                            <div class={ns('menu-list-item-name')}>{element.title}</div>
                          </li>
                        )
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }
  }
})
