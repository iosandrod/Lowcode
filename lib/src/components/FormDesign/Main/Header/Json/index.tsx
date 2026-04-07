import { computed, defineComponent, ref } from 'vue'
import { CodeHighLight, Icon } from '@/components'
import { useDesignInstance, useUI } from '@/hooks'
import type { FormSchema } from '@/types'
import { ns } from '@/utils'
import { jsJsonSchema, jsVue, tsJsonSchema, tsVue } from './config'
import JsonSchemaEdit from './Edit'

export default defineComponent({
  name: 'JsonSchemaModal',
  props: {
    visible: {
      type: Boolean
    }
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const { Modal, Tabs, TabPane } = useUI()
    const designInstance = useDesignInstance()!
    const json = computed(() => designInstance.getSchema())
    const formValues = ref({})

    const onSave = (json: FormSchema) => {
      designInstance.setSchema(json)
      designInstance.recordHistory('编辑JSON')
      emit('update:visible', false)
    }

    return () => (
      <Modal
        visible={props.visible}
        title="JsonSchema"
        width="75%"
        center
        destroyOnClose
        to={`.${ns('form-design')}`}
        top="5vh"
        onClose={() => {
          formValues.value = {}
          emit('update:visible', false)
        }}
      >
        <Tabs model-value="edit" class="demo-tabs">
          <TabPane name="edit">
            {{
              label: () => (
                <>
                  <Icon name="script" style={{ marginRight: '5px' }} />
                  <span>在线编辑</span>
                </>
              ),
              default: () => <JsonSchemaEdit json={json.value} onSave={onSave} />
            }}
          </TabPane>
          <TabPane name="ts" lazy>
            {{
              label: () => (
                <>
                  <Icon name="ts" style={{ marginRight: '5px' }} />
                  <span>生成TS文件</span>
                </>
              ),
              default: () => (
                <CodeHighLight
                  style={{ height: '70vh' }}
                  language="ts"
                  code={tsJsonSchema(json.value)}
                />
              )
            }}
          </TabPane>
          <TabPane name="js" lazy>
            {{
              label: () => (
                <>
                  <Icon name="js" style={{ marginRight: '5px' }} />
                  <span>生成JS文件</span>
                </>
              ),
              default: () => (
                <CodeHighLight
                  style={{ height: '70vh' }}
                  language="js"
                  code={jsJsonSchema(json.value)}
                />
              )
            }}
          </TabPane>
          <TabPane name="tsVue" lazy>
            {{
              label: () => (
                <>
                  <Icon name="vue" style={{ marginRight: '5px' }} />
                  <span>生成TS组件</span>
                </>
              ),
              default: () => (
                <CodeHighLight style={{ height: '70vh' }} language="vue" code={tsVue(json.value)} />
              )
            }}
          </TabPane>
          <TabPane name="jsVue" lazy>
            {{
              label: () => (
                <>
                  <Icon name="vue" style={{ marginRight: '5px' }} />
                  <span>生成JS组件</span>
                </>
              ),
              default: () => (
                <CodeHighLight style={{ height: '70vh' }} language="vue" code={jsVue(json.value)} />
              )
            }}
          </TabPane>
        </Tabs>
      </Modal>
    )
  }
})
