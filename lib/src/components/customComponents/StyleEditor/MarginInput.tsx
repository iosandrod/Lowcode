import { defineComponent, ref, watch } from 'vue'
import { Icon } from '@/components'
import { ns } from '@/utils'
import UnitInput from './UnitInput'
import './MarginInput.scss'

export default defineComponent({
  name: 'MarginInput',
  props: {
    label: {
      type: String,
      default: '边距'
    },
    presets: {
      type: Array as () => string[],
      default: () => ['auto', '0']
    },
    units: {
      type: Array as () => string[],
      default: () => ['px', '%', 'em', 'rem']
    },
    defaultMode: {
      type: String as () => 'preset' | 'unit',
      default: 'unit'
    },
    defaultValue: {
      type: Number,
      default: 0
    },
    defaultUnit: {
      type: String,
      default: 'px'
    }
  },
  setup(props) {
    const modelValue = defineModel<string>({ default: '' })

    const expanded = ref(false)
    const unifiedValue = ref('')
    const topValue = ref('')
    const rightValue = ref('')
    const bottomValue = ref('')
    const leftValue = ref('')
    const isSyncing = ref(false)

    const toggleExpand = () => {
      expanded.value = !expanded.value
    }

    const parseMargin = (margin: string) => {
      if (!margin) return { top: '', right: '', bottom: '', left: '' }

      const parts = margin.trim().split(/\s+/)

      if (parts.length === 1) {
        return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] }
      } else if (parts.length === 2) {
        return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] }
      } else if (parts.length === 3) {
        return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] }
      } else if (parts.length === 4) {
        return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }
      }

      return { top: '', right: '', bottom: '', left: '' }
    }

    const composeMargin = (top: string, right: string, bottom: string, left: string): string => {
      if (!top && !right && !bottom && !left) return ''

      if (top && top === right && top === bottom && top === left) {
        return top
      }

      if (top === bottom && right === left) {
        return `${top} ${right}`
      }

      return `${top} ${right} ${bottom} ${left}`
    }

    const initValues = () => {
      const parsed = parseMargin(modelValue.value)
      topValue.value = parsed.top
      rightValue.value = parsed.right
      bottomValue.value = parsed.bottom
      leftValue.value = parsed.left

      if (
        topValue.value &&
        topValue.value === rightValue.value &&
        topValue.value === bottomValue.value &&
        topValue.value === leftValue.value
      ) {
        unifiedValue.value = topValue.value
      } else {
        unifiedValue.value = ''
      }
    }

    const handleUnifiedChange = (value: string) => {
      if (isSyncing.value) return
      isSyncing.value = true

      topValue.value = value
      rightValue.value = value
      bottomValue.value = value
      leftValue.value = value

      modelValue.value = value

      isSyncing.value = false
    }

    const handleChildChange = () => {
      if (isSyncing.value) return
      isSyncing.value = true

      unifiedValue.value = ''

      const composed = composeMargin(
        topValue.value,
        rightValue.value,
        bottomValue.value,
        leftValue.value
      )
      modelValue.value = composed

      if (
        topValue.value &&
        topValue.value === rightValue.value &&
        topValue.value === bottomValue.value &&
        topValue.value === leftValue.value
      ) {
        unifiedValue.value = topValue.value
      }

      isSyncing.value = false
    }

    watch(
      () => modelValue.value,
      () => {
        if (!isSyncing.value) {
          initValues()
        }
      },
      { immediate: true }
    )

    return () => (
      <div class={ns('margin-input')}>
        <div class="margin-input__unified">
          <div class="margin-input__toggle" onClick={toggleExpand}>
            <Icon
              name="arrowDown"
              class={['margin-input__arrow', { 'is-expanded': expanded.value }]}
            />
          </div>
          <span class="margin-input__label">{props.label}</span>
          <UnitInput
            v-model={unifiedValue.value}
            presets={props.presets}
            units={props.units}
            default-mode={props.defaultMode as any}
            default-value={props.defaultValue}
            default-unit={props.defaultUnit}
            class="margin-input__unified-input"
            onUpdate:model-value={handleUnifiedChange}
          />
        </div>

        {expanded.value && (
          <div class="margin-input__details">
            <div class="margin-input__row">
              <div class="margin-input__item">
                <span class="margin-input__icon">↑</span>
                <UnitInput
                  v-model={topValue.value}
                  presets={props.presets}
                  units={props.units}
                  default-mode={props.defaultMode as any}
                  default-value={props.defaultValue}
                  default-unit={props.defaultUnit}
                  onUpdate:model-value={handleChildChange}
                />
              </div>
              <div class="margin-input__item">
                <span class="margin-input__icon">→</span>
                <UnitInput
                  v-model={rightValue.value}
                  presets={props.presets}
                  units={props.units}
                  default-mode={props.defaultMode as any}
                  default-value={props.defaultValue}
                  default-unit={props.defaultUnit}
                  onUpdate:model-value={handleChildChange}
                />
              </div>
            </div>
            <div class="margin-input__row">
              <div class="margin-input__item">
                <span class="margin-input__icon">↓</span>
                <UnitInput
                  v-model={bottomValue.value}
                  presets={props.presets}
                  units={props.units}
                  default-mode={props.defaultMode as any}
                  default-value={props.defaultValue}
                  default-unit={props.defaultUnit}
                  onUpdate:model-value={handleChildChange}
                />
              </div>
              <div class="margin-input__item">
                <span class="margin-input__icon">←</span>
                <UnitInput
                  v-model={leftValue.value}
                  presets={props.presets}
                  units={props.units}
                  default-mode={props.defaultMode as any}
                  default-value={props.defaultValue}
                  default-unit={props.defaultUnit}
                  onUpdate:model-value={handleChildChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
})
