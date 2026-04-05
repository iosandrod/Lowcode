import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { computed, defineComponent, ref } from 'vue'
import { useAi, useUI } from '@/hooks'
import './GlobalStyle.scss'

export default defineComponent({
  name: 'GlobalStyle',
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { Button, Modal, Input, Message } = useUI()

    const modelValue = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v)
    })

    const visible = ref<boolean>(false)
    const cssText = ref<string>('')

    const { isAvailable: isAiAvailable, request: aiRequest } = useAi()
    const aiPrompt = ref('')
    const aiLoading = ref(false)

    const handleEdit = () => {
      visible.value = true
      cssText.value = modelValue.value || ''
      aiPrompt.value = ''
    }

    const editorOptions = {
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on' as const,
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      tabSize: 2,
      wordWrap: 'on' as const,
      suggest: {
        snippetsPreventQuickSuggestions: false
      },
      quickSuggestions: true,
      acceptSuggestionOnEnter: 'on' as const
    }

    const handleSave = () => {
      modelValue.value = cssText.value
      visible.value = false
    }

    const getFormDomStructure = (): { formId: string; domHtml: string } | null => {
      const formElements = document.querySelectorAll('[data-form-id]')

      if (formElements.length === 0) {
        return null
      }

      let formElement: Element | null = null
      let formId = ''

      const canvasForm = document.querySelector('.form-design-canvas [data-form-id]')
      if (canvasForm) {
        formElement = canvasForm
        formId = canvasForm.getAttribute('data-form-id') || ''
      } else {
        formElement = formElements[0]
        formId = formElement.getAttribute('data-form-id') || ''
      }

      if (!formElement) {
        return null
      }

      const domHtml = (formElement as HTMLElement).innerHTML || ''

      return {
        formId,
        domHtml
      }
    }

    const handleAiGenerate = async () => {
      if (!aiPrompt.value.trim()) {
        Message.warning('请输入样式生成需求')
        return
      }

      aiLoading.value = true

      try {
        await new Promise((resolve) => setTimeout(resolve, 100))

        const domInfo = getFormDomStructure()

        if (!domInfo || !domInfo.domHtml) {
          Message.warning('无法获取表单DOM结构，请确保表单已渲染')
          return
        }

        const { formId, domHtml } = domInfo

        const prompt = `你是一个CSS样式生成助手。请根据用户需求为表单生成细粒度的CSS样式。

## 表单DOM结构（完整HTML）：
表单ID：\`${formId}\`
表单会被包裹在一个带有 \`data-form-id="${formId}"\` 属性的容器中，样式会自动作用域化。
以下是表单的完整DOM结构（HTML）：

\`\`\`html
${domHtml}
\`\`\`

## 重要说明：
样式代码会被自动包裹在 \`[data-form-id="${formId}"]\` 选择器中，所以你只需要写内部的CSS规则，不需要包含根选择器。

## CSS选择器规则（直接使用，不需要包含根选择器）：
根据上面提供的完整DOM结构，使用实际的类名、标签名和属性来构建选择器：
1. 使用类名选择器：\`.类名\`
2. 使用ID选择器：\`#id\`
3. 使用属性选择器：\`[name="字段名"]\`、\`[type="类型"]\`、\`[data-*]\`
4. 使用标签选择器：\`标签名\`
5. 组合选择器：\`.类名 标签名\`、\`.类名:has([name="字段名"])\`
6. 伪类选择器：\`:hover\`、\`:focus\`、\`:active\`等

## 用户需求：
${aiPrompt.value}

## 要求：
1. 只返回纯CSS代码，不要有任何其他说明文字、注释或代码块标记
2. 不要包含根选择器 \`[data-form-id="${formId}"]\`，直接写样式规则即可
3. 根据上面提供的完整DOM结构，分析HTML并使用实际的类名、标签和属性来构建选择器
4. 生成的样式要细粒度，能够精确控制每个组件的样式
5. 使用现代CSS特性，确保样式美观且符合用户需求
6. 如果用户需求涉及特定字段，优先使用 \`[name="字段名"]\` 属性选择器进行精确选择
7. 样式要响应式友好，考虑不同屏幕尺寸
8. 不要生成无效或冲突的样式规则

请直接输出CSS代码：`

        const result = await aiRequest(prompt)

        if (result) {
          let generatedCss = typeof result === 'string' ? result.trim() : String(result)

          generatedCss = generatedCss
            .replace(/```css\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()

          if (cssText.value.trim()) {
            cssText.value = cssText.value + '\n\n' + generatedCss
          } else {
            cssText.value = generatedCss
          }

          aiPrompt.value = ''
          Message.success('AI生成样式成功')
        }
      } catch (error: any) {
        console.error('AI生成失败:', error)
        Message.error(error?.message || 'AI生成失败')
      } finally {
        aiLoading.value = false
      }
    }

    return () => (
      <div>
        <Button type="primary" plain size="small" onClick={handleEdit}>
          编辑
        </Button>
        <Modal
          visible={visible.value}
          title="全局样式配置"
          append-to-body
          destroy-on-close
          width="800px"
        >
          {isAiAvailable && (
            <div class="ai-section">
              <div class="ai-input-wrapper">
                <Input
                  v-model={aiPrompt.value}
                  placeholder="描述你想要的样式效果，例如：让所有输入框有圆角边框，标签文字使用蓝色"
                  clearable
                >
                  {{
                    append: () => (
                      <Button
                        type="primary"
                        icon="magic"
                        onClick={handleAiGenerate}
                        loading={aiLoading.value}
                      >
                        AI生成样式
                      </Button>
                    )
                  }}
                </Input>
              </div>
            </div>
          )}

          <div
            class="monaco-editor-wrapper"
            style="height: 500px; border: 1px solid #dcdfe6; border-radius: 4px"
          >
            <VueMonacoEditor
              v-model:value={cssText.value}
              language="css"
              theme="vs-dark"
              options={editorOptions}
            />
          </div>

          {{
            footer: () => (
              <>
                <Button onClick={() => (visible.value = false)}>取消</Button>
                <Button type="primary" onClick={handleSave}>
                  保存
                </Button>
              </>
            )
          }}
        </Modal>
      </div>
    )
  }
})
