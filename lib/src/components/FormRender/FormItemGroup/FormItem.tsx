import { computed, defineComponent, h } from 'vue'
import { Icon } from '@/components'
import { useElements, useFormInstance, useUI } from '@/hooks'
import type { FormItemType } from '@/types'
import { filterExpressions, ns, parseRules } from '@/utils'
import './FormItem.scss'

export default defineComponent({
  name: 'FormItem',
  props: {
    label: { type: String, default: undefined },
    labelWidth: { type: [Number, String], default: undefined },
    labelAlign: { type: String, default: undefined },
    size: { type: String, default: undefined },
    name: { type: String, required: true },
    required: { type: Boolean, default: undefined },
    help: { type: String, default: undefined },
    alert: { type: String, default: undefined },
    items: { type: Array, default: undefined },
    when: { type: [Boolean, String], default: true },
    show: { type: Boolean, default: true },
    rules: { type: Array, default: () => [] },
    class: { type: [String, Object, Array], default: undefined },
    style: { type: [String, Object], default: undefined },
    linkages: { type: Array, default: undefined },
    component: { type: String, required: true },
    componentProps: { type: Object, default: () => ({}) },
    defaultValue: { type: [String, Number, Boolean, Object, Array], default: undefined },
    designKey: { type: String, default: undefined },
    colon: { type: Boolean, default: undefined }
  },
  setup(props) {
    const { FormItem, Alert, Tooltip } = useUI()

    const formInstance = useFormInstance()!
    const elements = useElements()

    const design = computed(() => formInstance?.getDesign() ?? false)

    const value = computed({
      get() {
        return formInstance.getFieldValue(props.name) ?? props.defaultValue
      },
      set(val: any) {
        formInstance.setFieldValue(props.name, val)
      }
    })

    const computeRules = computed(() => {
      const { rules = [], required, show, when } = props as FormItemType

      if (!design.value && (!when || !show)) {
        return []
      }

      const hasRequiredInRules = rules.some((rule: any) => rule.type === 'required')
      if (hasRequiredInRules) {
        return parseRules(rules as any[], props.name)
      }

      if (required) {
        const defaultRequiredRule = {
          type: 'required' as const,
          message: '该字段是必填字段',
          trigger: 'blur'
        }
        return parseRules([defaultRequiredRule, ...(rules as any[])], props.name)
      }

      return parseRules(rules as any[], props.name)
    })

    const config = computed(() => {
      const data = elements[props.component]
      if (!data) {
        return {
          modelName: 'modelValue',
          type: undefined,
          render: undefined
        } as any
      }

      if (!data.modelName) {
        return { ...data, modelName: 'modelValue' }
      }

      return data
    })

    const classNames = computed(() => {
      return [
        ns('form-item'),
        props.class,
        `${config.value.component}-${props.name}`,
        { 'hide-label': props.labelWidth === 0 || !props.label },
        props.labelAlign && `label-align-${props.labelAlign}`
      ]
    })

    const RenderComponent = () => {
      const propsData = filterExpressions(props.componentProps as any)

      const componentProps = {
        name: props.name,
        formItemProps: props,
        modelValue: value.value,
        'onUpdate:modelValue': (val: any) => {
          value.value = val
        },
        ...propsData
      }

      return h(config.value.render, componentProps)
    }

    const labelContent = () => (
      <div class={[ns('form-item-label'), props.label && `${props.name}-label`]}>
        <div>{props.label}</div>
        {props.help && (
          <Tooltip effect="dark" content={props.help}>
            <Icon name="help" />
          </Tooltip>
        )}
        {props.colon && <div class={ns('form-item-label-suffix')}>:</div>}
      </div>
    )

    if (props.design || props.when) {
      if (config.value.type === 'basic' || config.value.type === 'high') {
        return () => (
          <FormItem
            v-show={design.value || props.show}
            class={classNames.value}
            style={props.style}
            key={props.name}
            name={props.name}
            rules={computeRules.value}
            labelWidth={props.labelWidth}
            labelAlign={props.labelAlign}
            size={props.size}
          >
            {{
              label: () => labelContent(),
              default: () => (
                <>
                  <RenderComponent />
                  {props.alert && (
                    <Alert class="form-item-alert" title={props.alert} show-icon closable={false} />
                  )}
                </>
              )
            }}
          </FormItem>
        )
      } else {
        return () => (
          <div v-show={design.value || props.show} class={classNames.value} style={props.style}>
            <RenderComponent />
          </div>
        )
      }
    }

    return () => null
  }
})
