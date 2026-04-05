import { defineComponent, ref } from 'vue'
import { FormRender } from '@/components'
import { useDesignInstance, useUI } from '@/hooks'
import { ns } from '@/utils'

export default defineComponent({
  name: 'Preview',
  props: {
    visible: {
      type: Boolean
    }
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const { Modal } = useUI()
    const designInstance = useDesignInstance()!
    const formValues = ref({})

    const handleFinish = async () => {
      console.log(formValues.value)
      alert(JSON.stringify(formValues.value, null, 2))
    }

    return () => (
      <Modal
        visible={props.visible}
        title="预览"
        width="70%"
        center
        destroyOnClose
        to={`.${ns('form-design')}`}
        top="10vh"
        onClose={() => {
          formValues.value = {}
          emit('update:visible', false)
        }}
      >
        <FormRender
          v-model={formValues.value}
          class="preview-FormRender"
          schema={designInstance.getSchema()}
          onFinish={handleFinish}
        />
      </Modal>
    )
  }
})
