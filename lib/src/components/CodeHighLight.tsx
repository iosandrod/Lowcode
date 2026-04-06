import { createHighlighterCore } from 'shiki/core'
import javascript from 'shiki/langs/javascript.mjs'
import json from 'shiki/langs/json.mjs'
import markdown from 'shiki/langs/markdown.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import vue from 'shiki/langs/vue-html.mjs'
import githubLight from 'shiki/themes/github-light.mjs'
import getWasm from 'shiki/wasm'
import { defineComponent, onMounted, ref } from 'vue'
import { Icon } from '@/components'
import { useUI } from '@/hooks'
import './CodeHighLight.scss'

export default defineComponent({
  name: 'CodeHighLight',
  props: {
    code: { type: String, required: true },
    language: { type: String, default: 'js' }
  },
  setup(props) {
    const { Message } = useUI()
    const html = ref('')

    const handleCopy = async () => {
      const textarea = document.createElement('textarea')
      textarea.value = props.code
      document.body.appendChild(textarea)
      textarea.select()
      textarea.setSelectionRange(0, 99999)
      document.execCommand('copy')
      document.body.removeChild(textarea)
      Message.success('已成功复制到剪贴板')
    }

    onMounted(async () => {
      const highlighter = await createHighlighterCore({
        themes: [githubLight],
        langs: [javascript, typescript, vue, json, markdown],
        loadWasm: getWasm
      })
      html.value = highlighter.codeToHtml(props.code, {
        lang: props.language,
        theme: 'github-light'
      })
    })

    return () => (
      <div class="vfc-codeHighLight">
        <div class="vfc-codeHighLight-copy" onClick={handleCopy}>
          <Icon name="copy" />
        </div>
        <div class="vfc-codeHighLight-content" v-html={html.value} />
      </div>
    )
  }
})
