import { defineComponent, ref, type Ref } from 'vue'
import { BubbleList, Sender } from 'vue-element-plus-x'
import type { BubbleListItemProps } from 'vue-element-plus-x/types/BubbleList'
import { Icon } from '@/components'
import generateSchemaPrompt from '@/config/generateSchemaPrompt.md?raw'
import { useAi, useDesignInstance } from '@/hooks'
import { ns, removeDesignKeys } from '@/utils'
import Welcome from './Welcome'
import './index.scss'

type BubbleItem = BubbleListItemProps & {
  key: number
  role: 'user' | 'ai'
}

export default defineComponent({
  name: 'FormDesignAI',
  setup() {
    const input = ref('')
    const inputLoading = ref(false)
    const list: Ref<BubbleItem[]> = ref([])

    const designInstance = useDesignInstance()!
    const { isAvailable, request, cancel } = useAi()

    const extractJson = (content: string): string => {
      if (typeof content !== 'string') {
        return content as string
      }
      let text = content.trim()
      const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/m
      const match = text.match(codeBlockRegex)
      if (match) {
        text = match[1].trim()
      }
      text = text
        .replace(/^```(?:json)?\s*\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .trim()
      return text
    }

    const startSSE = async () => {
      if (input.value === '') {
        return
      }

      if (!isAvailable) {
        list.value = [
          ...list.value,
          {
            key: Date.now(),
            role: 'user',
            content: input.value,
            placement: 'end'
          },
          {
            key: Date.now(),
            role: 'ai',
            content: '❌ AI功能未配置,请在app.use时注入ai函数'
          }
        ]
        return
      }

      onCancel()

      list.value = [
        ...list.value,
        {
          key: Date.now(),
          role: 'user',
          content: input.value,
          placement: 'end'
        },
        {
          key: Date.now(),
          role: 'ai',
          content: '',
          loading: true
        }
      ]

      const userInput = input.value
      input.value = ''

      const current = list.value.at(-1)!

      try {
        const schema = removeDesignKeys(designInstance.getSchema())
        const promptPayload = {
          currentSchema: schema,
          requirement: userInput
        }
        const prompt = `${generateSchemaPrompt}\n\n输入上下文(JSON):${JSON.stringify(promptPayload)}`

        const result = await request(prompt)

        if (!result) {
          current.content = current.content || '生成失败'
          return
        }

        try {
          const jsonString =
            typeof result === 'string' ? extractJson(result) : JSON.stringify(result)
          const json = JSON.parse(jsonString)
          current.content = '✓ 已为您修改表单'
          designInstance.setSchema(json)
          designInstance.recordHistory('AI生成表单')
        } catch (e) {
          console.error('AI生成错误:', { error: e, rawContent: result })
          current.content = 'AI生成错误，请检查输出格式'
        }
      } finally {
        inputLoading.value = false
        current.loading = false
      }
    }

    const handleItemClick = (item: string) => {
      input.value = item
      startSSE()
    }

    const onCancel = () => {
      inputLoading.value = false
      cancel()
    }

    const footerConfig = [
      {
        icon: 'copy',
        onClick: (item: BubbleItem) => {
          input.value = item.content!
        }
      },
      {
        icon: 'refresh',
        onClick: (item: BubbleItem) => {
          input.value = item.content!
          startSSE()
        }
      }
    ]

    const handleClear = () => {
      list.value = []
      input.value = ''
    }

    return () => (
      <div class={ns('form-design-ai')}>
        <div class="content">
          {list.value.length === 0 && <Welcome onItem-click={handleItemClick} />}

          <BubbleList
            list={list.value}
            class="bubble-list"
            {...({
              scopedSlots: {
                loading: () => (
                  <div class="loading">
                    <div class="loading-loader"></div>
                    <div class="loading-text">表单制作中 请稍等...</div>
                  </div>
                ),
                footer: ({ item }: { item: BubbleItem }) =>
                  item.role === 'user' ? (
                    <div class="footer">
                      {footerConfig.map(({ icon, onClick }) => (
                        <div key={icon} class="item" onClick={() => onClick(item)}>
                          <Icon name={icon} />
                        </div>
                      ))}
                    </div>
                  ) : null
              }
            } as any)}
          />
        </div>

        <div class="sender">
          {list.value.length > 0 && (
            <div class="clear" onClick={handleClear}>
              <Icon name="clear" />
            </div>
          )}
          <Sender
            modelValue={input.value}
            onUpdate:modelValue={(v: string) => {
              input.value = v
            }}
            onSubmit={startSSE}
            onCancel={onCancel}
            loading={inputLoading.value}
          />
        </div>
      </div>
    )
  }
})
