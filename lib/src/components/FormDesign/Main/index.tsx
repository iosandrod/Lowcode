import { defineComponent } from 'vue'
import { ns } from '@/utils'
import AttrPanel from './AttrPanel/index'
import Canvas from './Canvas/index'
import Header from './Header/index'
import './index.scss'

export default defineComponent({
  name: 'FormDesignMain',
  setup() {
    return () => (
      <div class={ns('form-design-main')}>
        <Header />
        <div class={ns('form-design-main-content')}>
          <Canvas />
          <AttrPanel />
        </div>
      </div>
    )
  }
})
