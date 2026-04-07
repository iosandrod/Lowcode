import { cloneDeep } from 'lodash'
import { computed, defineComponent, ref } from 'vue'
import { useUI } from '@/hooks'
import type { FormSchema } from '@/types'
import { ns, removeDesignKeys } from '@/utils'
import './Edit.scss'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'

export default defineComponent({
  name: 'JsonSchemaEdit',
  props: {
    json: {
      type: Object as () => FormSchema,
      required: true
    }
  },
  emits: ['save'],
  setup(props, { emit }) {
    let { Button, Message } = useUI()
    let jsonString = ref('')
    try {
      jsonString.value= JSON.stringify(props.json, null, 2)//      
    } catch (error) {
      
    }
    const editorOptions = {
      automaticLayout: true,
      formatOnType: true,
      formatOnPaste: true,
      minimap: {
        enabled: false
      },
      scrollBeyondLastLine: false,
      fontSize: 14,
      tabSize: 2
    }

    const handleSave = () => {
      try {
        const parsedJson = JSON.parse(jsonString.value)
        emit('save', cloneDeep(parsedJson))
        Message.success('保存成功')
      } catch (error) {
        Message.error('JSON格式错误，请检查后重试')
      }
    }

    const handleReset = () => {
      const jsonWithoutDesignKey = removeDesignKeys(cloneDeep(props.json))
      jsonString.value = JSON.stringify(jsonWithoutDesignKey, null, 2)
    }

    const handleClear = () => {
      jsonString.value = ''
    }

    return () => (
      <div class={ns('save-json-edit')}>
        <VueMonacoEditor
          v-model:value={jsonString.value}
          language="json"
          options={editorOptions}
          style={{ height: '500px' }}
        />
        <div class="footer">
          <Button onClick={handleClear}>清空</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button onClick={handleSave} type="primary">
            保存
          </Button>
        </div>
      </div>
    )
  }
})
