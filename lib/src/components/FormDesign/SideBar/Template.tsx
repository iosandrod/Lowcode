import { defineComponent, h } from 'vue'
import { Icon, Tree } from '@/components'
import { useDesignInstance } from '@/hooks'
import templates from '@/templates'
import { ns } from '@/utils'
import './Template.scss'

export default defineComponent({
  name: 'TemplatePanel',
  setup() {
    const designInstance = useDesignInstance()!

    const useTemplate = (template: any) => {
      designInstance.setSchema(template.schema)
      designInstance.recordHistory(`使用模板-${template.label}`)
    }

    return () => (
      <div class={ns('template-list')}>
        <Tree data={templates} nodeKey="label">
          {({ data }: any) => {
            // catalog item with children
            if (data?.children) {
              return (
                <div class="catalog">
                  <Icon name="catalog" />
                  <span>{` ${data.label}`}</span>
                </div>
              )
            }
            // actual template item
            return (
              <div class="form">
                <div class="form-header">
                  <Icon name="form" />
                  <span>{data.label}</span>
                  <span class="edit" onClick={() => useTemplate(data)}>
                    <Icon name="edit" />
                  </span>
                </div>
                {data?.description ? <div class="form-description">{data.description}</div> : null}
              </div>
            )
          }}
        </Tree>
      </div>
    )
  }
})
