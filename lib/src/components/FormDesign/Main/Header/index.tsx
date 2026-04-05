import { computed, defineComponent, ref } from 'vue'
import { Icon } from '@/components'
import { useDesignInstance, useUI } from '@/hooks'
import { ns } from '@/utils'
import Json from './Json/index.tsx'
import Preview from './Preview.tsx'
import './index.scss'

type PreviewAction = {
  label: string
  btnType: 'default' | 'primary' | 'text' | 'success' | 'warning' | 'info' | 'danger'
  icon?: string
  name?: string
  onClick: () => void
}

export default defineComponent({
  name: 'FormDesignHeader',
  setup() {
    const { Button, Message } = useUI()
    const designInstance = useDesignInstance()!

    const historyIndex = computed(() => designInstance.getHistoryIndex())
    const history = computed(() => designInstance.getHistory())
    const fullScreen = computed(() => designInstance.getFullScreen())

    const JsonVisible = ref(false)
    const PreviewVisible = ref(false)

    const btnSize = 'small'

    const rightActions: PreviewAction[] = [
      {
        label: '预览',
        btnType: 'default',
        name: 'preview-design',
        icon: 'eye',
        onClick: () => {
          PreviewVisible.value = true
        }
      },
      {
        label: 'JSON',
        btnType: 'primary',
        icon: 'script',
        onClick: () => {
          JsonVisible.value = true
        }
      },
      {
        label: '清空',
        btnType: 'danger',
        icon: 'trash',
        name: 'clear-design',
        onClick: async () => {
          await Message.confirm('确认清空当前设计吗？')
          designInstance.handleClear()
        }
      },
      {
        label: '保存',
        icon: 'save',
        btnType: 'primary',
        onClick: () => {
          designInstance.handleEmit('save')
        }
      }
    ]

    return () => (
      <div class={ns('form-design-header')}>
        <div class="left">
          <Button
            disabled={historyIndex.value === -1}
            name="history-back"
            size={btnSize}
            icon="back"
            onClick={() => designInstance.handleHistoryBack()}
          />
          <Button
            name="history-forward"
            disabled={historyIndex.value === history.value.length - 1 || history.value.length === 0}
            size={btnSize}
            icon="forward"
            onClick={() => designInstance.handleHistoryForward()}
          />
          <Button
            icon={fullScreen.value ? 'cancelFullScreen' : 'fullScreen'}
            size={btnSize}
            onClick={() => designInstance.handleToggleFullScreen()}
          />
        </div>

        <div class="right">
          {rightActions.map((action) => (
            <Button
              key={action.label}
              type={action.btnType}
              name={action.name}
              size={btnSize}
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
        <Json visible={JsonVisible.value} onUpdate:visible={(v) => (JsonVisible.value = v)} />
        <Preview
          visible={PreviewVisible.value}
          onUpdate:visible={(v) => (PreviewVisible.value = v)}
        />
      </div>
    )
  }
})
