import { cloneDeep, omit } from 'lodash'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  provide,
  reactive,
  ref,
  watch
} from 'vue'
import type { VNode } from 'vue'
import { initSchema } from '@/config'
import { useUI } from '@/hooks'
import { $formInstance } from '@/symbol'
import type { FormInstance, FormRenderEmits, FormRenderProps } from '@/types'
import type { FormProtocol } from '@/types/uiAdapter'
import { deepParse, getDataByPath, setDataByPath } from '@/utils'
import FormItemGroup from './FormItemGroup/index'
import './FormRender.scss'

export default defineComponent({
  name: 'FormRender',
  props: {
    schema: {
      type: Object as () => any,
      default: () => ({})
    },
    schemaContext: {
      type: Object as () => Record<string, any>,
      default: () => ({})
    },
    design: {
      type: Boolean,
      default: undefined
    },
    read: {
      type: Boolean,
      default: undefined
    },
    modelValue: {
      type: Object as () => Record<string, any>,
      default: () => reactive({})
    }
  },
  emits: ['update:modelValue', 'change', 'finish', 'failed', 'reset', 'fieldChange'],
  setup(props, { attrs, emit, expose, slots }) {
    const { Form, FormItem, Button } = useUI()

    const formValues = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v)
    })

    const formRef = ref<FormProtocol['expose']>()
    const selectData = reactive<Record<string, Record<string, any>>>({})
    const innerSchema = ref(cloneDeep(props.schema || {}))

    watch(
      () => props.schema,
      (newSchema) => {
        innerSchema.value = cloneDeep(newSchema)
      }
    )

    const trigger = (eventName: keyof FormRenderEmits, ...args: any[]) => {
      ;(emit as any)(eventName, ...args)
      const schemaEventName = `on${eventName[0].toUpperCase()}${eventName.slice(1)}`
      const handler = (innerSchema.value as any)[schemaEventName]
      handler?.(...args)
    }

    const getValues: FormInstance['getValues'] = () => formValues.value

    const setValues: FormInstance['setValues'] = (values) => {
      emit('update:modelValue', values)
      trigger('change', values)
    }

    const getFieldValue: FormInstance['getFieldValue'] = (path) => getDataByPath(getValues(), path)

    const setFieldValue: FormInstance['setFieldValue'] = async (path, value) => {
      const current = getValues()
      setDataByPath(current, path, value)
      emit('update:modelValue', cloneDeep(current))
      trigger('fieldChange', path, value)
    }

    const validate: FormInstance['validate'] = () => formRef.value!.validate()

    const submit: FormInstance['submit'] = () => {
      validate()
        ?.then(() => {
          trigger('finish', formValues.value)
        })
        .catch((e: any) => {
          trigger('failed', e)
        })
    }

    const resetFields: FormInstance['resetFields'] = (names) => {
      trigger('reset')
      formRef.value?.resetFields(names)
    }

    const updateSelectData: FormInstance['updateSelectData'] = (key, value) => {
      selectData[key] = value
    }

    const setFieldAttr: FormInstance['setFieldAttr'] = (name, path, value) => {
      const findAndUpdate = (items: any[]): boolean => {
        for (const item of items) {
          if (item.name === name) {
            const updated = setDataByPath(item, path, value)
            Object.assign(item, updated)
            return true
          }
          if (item.items && findAndUpdate(item.items)) {
            return true
          }
        }
        return false
      }

      if (innerSchema.value.items) {
        findAndUpdate(innerSchema.value.items)
      }
    }

    const instanceAPI = {
      getValues,
      setValues,
      getFieldValue,
      setFieldValue,
      updateSelectData,
      setFieldAttr,
      validate,
      resetFields,
      submit
    }

    const context = computed(() => ({
      ...props.schemaContext,
      $values: formValues.value,
      $selectData: selectData,
      $instance: instanceAPI
    }))

    const parseSchema = computed(() => {
      let schema = {
        ...cloneDeep(initSchema),
        ...innerSchema.value
      }

      if (props.design) {
        return schema
      }

      return deepParse(schema, context.value)
    })

    const formAttrs = computed(() => {
      const attrs = omit(parseSchema.value as any, [
        'model',
        'items',
        'initialValues',
        'colon',
        'onFieldChange',
        'onChange',
        'submitBtn',
        'resetBtn'
      ])
      return attrs
    })

    let autoFormId = `fm-form-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const formId = computed(() => {
      return innerSchema.value.formId || props.schema.formId || autoFormId
    })

    const styleElement = ref<HTMLStyleElement | null>(null)

    watch(
      () => parseSchema.value.styleBlock,
      (newStyleBlock) => {
        if (styleElement.value && styleElement.value.parentNode) {
          styleElement.value.parentNode.removeChild(styleElement.value)
          styleElement.value = null
        }

        if (newStyleBlock) {
          styleElement.value = document.createElement('style')
          styleElement.value.setAttribute('data-form-style', formId.value)
          const cssText = `[data-form-id="${formId.value}"] {\n${newStyleBlock}\n}`
          styleElement.value.textContent = cssText
          document.head.appendChild(styleElement.value)
        }
      },
      { immediate: true }
    )

    onBeforeMount(() => {
      if (!props.design && innerSchema.value.initialValues) {
        const values = cloneDeep(innerSchema.value.initialValues)
        emit('update:modelValue', { ...values, ...formValues.value })
      }
    })

    onBeforeUnmount(() => {
      if (styleElement.value && styleElement.value.parentNode) {
        styleElement.value.parentNode.removeChild(styleElement.value)
      }
    })

    const instance: FormInstance = {
      getSchema: () => innerSchema.value,
      getSchemaContext: () => props.schemaContext,
      getDesign: () => props.design,
      getRead: () => props.read,
      getSelectData: () => selectData,
      getContext: () => context.value,
      getValues,
      setValues,
      getFieldValue,
      setFieldValue,
      updateSelectData,
      setFieldAttr,
      validate,
      resetFields,
      submit
    }

    provide($formInstance, instance)

    expose(instance)

    return () => (
      <Form
        model={formValues.value}
        ref={(el: any) => {
          formRef.value = el
        }}
        {...formAttrs.value}
        data-form-id={formId.value}
        {...attrs}
      >
        {slots.default?.()}
        <FormItemGroup list={parseSchema.value.items} designKey="root" />
        {!props.design &&
          !props.read &&
          (parseSchema.value.submitBtn || parseSchema.value.resetBtn) && (
            <FormItem label=" ">
              <div style="display: flex; gap: 15px">
                {parseSchema.value.submitBtn && (
                  <Button type="primary" onClick={() => instance.submit()} name="submit-btn">
                    提交
                  </Button>
                )}
                {parseSchema.value.resetBtn && (
                  <Button onClick={() => instance.resetFields()} name="reset-btn">
                    重置
                  </Button>
                )}
              </div>
            </FormItem>
          )}
      </Form>
    )
  }
})
