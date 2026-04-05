import { computed, defineComponent } from 'vue'
import { FormRender } from '@/components'
import { formAttrSchema } from '@/config'
import { useDesignInstance, useElements } from '@/hooks'
import type { FormItemType, FormSchema } from '@/types'
import { ns } from '@/utils'

export default defineComponent({
  name: 'AttrEdit',
  setup() {
    const designInstance = useDesignInstance()!
    const elements = useElements()

    const currentKey = computed(() => designInstance.getCurrentKey())

    const schemaModel = computed({
      get() {
        return designInstance.getSchema()
      },
      set(schema) {
        designInstance.setSchema(schema)
      }
    })

    const nodeModel = computed({
      get() {
        return designInstance.getNodeByKey(currentKey.value)
      },
      set(node) {
        const oldNode = designInstance.getNodeByKey(currentKey.value)
        if (oldNode) {
          Object.assign(oldNode, node)
        }
      }
    })

    const attrSchema = computed<FormSchema>(() => {
      if (!nodeModel.value) {
        return { size: 'small', labelAlign: 'top', items: [] } satisfies FormSchema
      }
      const config = elements[nodeModel.value!.component]

      if (config?.attrSchema) {
        const parseItems = (nodes: FormItemType[] = []): FormItemType[] => {
          return nodes.map((item) => {
            const value = nodeModel.value?.[item.name as keyof typeof nodeModel.value]
            const isTemplate = typeof value === 'string' && /{{\s*(.*?)\s*}}/.test(value)

            return {
              ...item,
              component: isTemplate ? 'Custom' : item.component,
              componentProps: isTemplate
                ? {
                    componentName: 'FormDesign-JsExpr'
                  }
                : item.componentProps,
              items: item.items && parseItems(item.items)
            }
          })
        }
        return {
          ...config.attrSchema,
          items: parseItems(config.attrSchema.items)
        }
      }

      return {
        size: 'small',
        labelAlign: 'top',
        items: [
          {
            name: 'text',
            labelWidth: 0,
            component: 'Text',
            componentProps: {
              text: '此节点不支持配置'
            }
          }
        ]
      } satisfies FormSchema
    })

    const onRootFieldChange = () => {
      designInstance.recordHistory(`修改表单属性`)
    }

    const onNodeFieldChange = () => {
      designInstance.recordHistory(`修改节点属性`)
    }

    return () => (
      <div class={ns('attr')}>
        {currentKey.value == 'root' ? (
          <FormRender
            v-model={schemaModel.value}
            schema={formAttrSchema}
            onFieldChange={onRootFieldChange}
          />
        ) : (
          <FormRender
            v-model={nodeModel.value!}
            schema={attrSchema.value}
            onFieldChange={onNodeFieldChange}
          />
        )}
      </div>
    )
  }
})
