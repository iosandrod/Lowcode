import { computed, defineComponent, onMounted, ref } from 'vue'
import { FormRender } from '@/components'
import { useDesignInstance, useUI } from '@/hooks'

export default defineComponent({
  name: 'InitialValues',
  props: {
    modelValue: {
      type: [Object, Array],
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { Button, Modal } = useUI()

    const modelValue = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v)
    })
    const visible = ref<boolean>()
    const designInstance = useDesignInstance()!
    const initialValues = ref()

    onMounted(() => {
      initialValues.value = modelValue.value
    })

    const handleSave = () => {
      modelValue.value = initialValues.value
      visible.value = false
    }

    const handleClose = () => {
      initialValues.value = modelValue.value
    }

    const handleClear = () => {
      initialValues.value = {}
    }

    return () => (
      <div>
        <Button type="primary" plain size="small" onClick={() => (visible.value = true)}>
          编辑
        </Button>
        <Modal
          visible={visible.value}
          title="表单初始值"
          append-to-body
          destroy-on-close
          onClose={handleClose}
        >
          <FormRender
            v-model={initialValues.value}
            schema={{ ...designInstance.getSchema(), submitBtn: false, resetBtn: false }}
          />
          {{
            footer: () => (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button onClick={handleClear}>清空</Button>
                <Button type="primary" onClick={handleSave}>
                  保存
                </Button>
              </div>
            )
          }}
        </Modal>
      </div>
    )
  }
})
