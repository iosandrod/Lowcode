import { computed, defineComponent, ref, watch } from 'vue'
import { useUI } from '@/hooks'
import { ns } from '@/utils'
import './UnitInput.scss'

export default defineComponent({
  name: 'UnitInput',
  props: {
    presets: {
      type: Array as () => string[],
      default: () => ['auto', 'inherit']
    },
    units: {
      type: Array as () => string[],
      default: () => ['px', '%', 'em', 'rem']
    },
    defaultMode: {
      type: String as () => 'preset' | 'unit',
      default: 'preset'
    },
    defaultValue: {
      type: Number,
      default: 0
    },
    defaultUnit: {
      type: String,
      default: undefined
    }
  },
  setup(props) {
    const { Button, InputNumber } = useUI()

    const modelValue = defineModel<string>({ default: '' })

    const currentMode = ref<'preset' | 'unit'>('preset')
    const currentPresetIndex = ref(0)
    const currentUnitIndex = ref(0)
    const numericValue = ref(0)

    const currentPresetValue = computed(() => props.presets[currentPresetIndex.value])
    const currentUnitValue = computed(() => props.units[currentUnitIndex.value])
    const currentValue = computed(() => {
      if (currentMode.value === 'preset') {
        return currentPresetValue.value
      }
      return `${numericValue.value}${currentUnitValue.value}`
    })

    const parseValue = (value: string) => {
      if (!value) {
        currentMode.value = props.defaultMode
        if (props.defaultMode === 'unit') {
          numericValue.value = props.defaultValue
          if (props.defaultUnit) {
            const unitIndex = props.units.indexOf(props.defaultUnit)
            currentUnitIndex.value = unitIndex !== -1 ? unitIndex : 0
          } else {
            currentUnitIndex.value = 0
          }
        } else {
          currentPresetIndex.value = 0
        }
        return
      }

      const presetIndex = props.presets.indexOf(value)
      if (presetIndex !== -1) {
        currentMode.value = 'preset'
        currentPresetIndex.value = presetIndex
        return
      }

      const match = value.match(/^(-?\d+\.?\d*)(.*)$/)
      if (match) {
        const [, num, unit] = match
        numericValue.value = parseFloat(num) || 0

        const unitIndex = props.units.indexOf(unit)
        if (unitIndex !== -1) {
          currentUnitIndex.value = unitIndex
        }

        currentMode.value = 'unit'
      } else {
        currentMode.value = props.defaultMode
        currentPresetIndex.value = 0
      }
    }

    const switchMode = () => {
      if (currentMode.value === 'preset') {
        if (currentPresetIndex.value < props.presets.length - 1) {
          currentPresetIndex.value++
        } else {
          currentMode.value = 'unit'
          currentPresetIndex.value = 0
          numericValue.value = 0
          currentUnitIndex.value = 0
        }
      } else {
        if (currentUnitIndex.value < props.units.length - 1) {
          currentUnitIndex.value++
        } else {
          currentMode.value = 'preset'
          currentUnitIndex.value = 0
          currentPresetIndex.value = 0
        }
      }

      modelValue.value = currentValue.value
    }

    const handleNumberChange = () => {
      modelValue.value = currentValue.value
    }

    watch(
      () => modelValue.value,
      (newVal) => {
        parseValue(newVal)
      },
      { immediate: true }
    )

    return () => (
      <div class={ns('unit-input')}>
        {currentMode.value === 'preset' ? (
          <Button class="unit-input__preset-btn" onClick={switchMode}>
            {currentPresetValue.value}
          </Button>
        ) : (
          <div class="unit-input__unit-mode">
            <InputNumber
              v-model={numericValue.value}
              class="unit-input__number"
              onChange={handleNumberChange}
            />
            <Button class="unit-input__unit-btn" onClick={switchMode}>
              {currentUnitValue.value}
            </Button>
          </div>
        )}
      </div>
    )
  }
})
