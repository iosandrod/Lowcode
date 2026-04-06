import { cloneDeep } from 'lodash'
import { computed, defineComponent } from 'vue'
import { useDesignInstance } from '@/hooks'
import { ns } from '@/utils'
import './History.scss'

// Component name: HistoryPanel

export default defineComponent({
  name: 'HistoryPanel',
  props: {
    // Explicitly define no external props for now; keeps API explicit
  },
  emits: {
    // Optional emit to notify parent of a jump action
    'jump-to': (index: number) => true
  },
  setup(props, { emit }) {
    const designInstance = useDesignInstance()!

    // History and index are reactive wrappers around the design instance state
    const history = computed(() => designInstance.getHistory())
    const historyIndex = computed(() => designInstance.getHistoryIndex())

    // Time formatting kept as a plain function per instructions
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp)
      const year = date.getFullYear().toString().slice(2)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
    }

    // Jump to a specific history record
    const handleJumpTo = (index: number) => {
      if (index === historyIndex.value) return

      designInstance.setHistoryIndex(index)
      const record = history.value[index]
      if (record) {
        designInstance.setSchema(cloneDeep(record.schema))
      }

      emit('jump-to', index)
    }

    // Render function using JSX
    return () => (
      <div class={ns('history-list')}>
        {history.value.length === 0 && <div class="empty-tip">暂无历史记录</div>}
        {history.value.map((record: any, index: number) => (
          <div
            key={index}
            class={['history-item', index === historyIndex.value ? ns('history-item-active') : '']}
            onClick={() => handleJumpTo(index)}
          >
            <div class="description">{record.description}</div>
            <div class="timestamp">{formatTime(record.timestamp)}</div>
          </div>
        ))}
      </div>
    )
  }
})
