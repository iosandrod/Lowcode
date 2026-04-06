import { computed, defineComponent, h, ref } from 'vue'
import { Icon } from '@/components'
import { useUI } from '@/hooks'
import { ns } from '@/utils'
import AI from './AI/index'
import History from './History'
import List from './List'
import Outline from './Outline'
import Template from './Template'
import './index.scss'

export default defineComponent({
  name: 'FormDesignLeft',
  setup() {
    const Tooltip = useUI().Tooltip as any

    const activeKey = ref('component')
    const visible = ref(true)

    const menus = [
      {
        title: '元素',
        key: 'component',
        icon: 'component',
        desc: '拖拽或双击组件',
        render: List
      },
      {
        title: '大纲',
        key: 'outline',
        icon: 'outline',
        desc: '',
        render: Outline
      },
      {
        title: '历史记录',
        key: 'history',
        icon: 'history',
        desc: '',
        render: History
      },
      {
        title: '模板',
        key: 'templates',
        icon: 'template',
        desc: '快速切换和配置表单。',
        render: Template
      },
      {
        title: 'AI表单助手',
        key: 'ai',
        icon: 'ai',
        desc: '',
        render: AI
      }
    ]

    const activeData = computed(() => {
      return menus.find((menu) => menu.key === activeKey.value)!
    })

    const handleClick = (key: string) => {
      activeKey.value = key
      visible.value = true
    }

    const handleClose = () => {
      visible.value = false
    }

    return () => (
      <div class={ns('form-design-left')}>
        <div class="sidebar">
          {menus.map((menu) => (
            <Tooltip key={menu.key} content={menu.title} placement="right">
              {{
                default: () => (
                  <div
                    class={['item', activeKey.value === menu.key ? 'active' : '']}
                    onClick={() => handleClick(menu.key)}
                  >
                    <Icon name={menu.icon} />
                  </div>
                )
              }}
            </Tooltip>
          ))}
        </div>
        {visible.value && (
          <div class="content">
            <div class="topbar">
              <div>
                {activeData.value.title} <span class="desc">{activeData.value.desc}</span>
              </div>
              <div class="close" onClick={handleClose}>
                <Icon name="close" />
              </div>
            </div>
            <div class="render">{h(activeData.value.render)}</div>
          </div>
        )}
      </div>
    )
  }
})
