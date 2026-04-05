import Basic from './Basic/index'
import GlobalStyle from './GlobalStyle'
import InitialValues from './InitialValues'
import JsExpr from './JsExpr'
import Linkages from './Linkages/Linkages'
import Options from './Options/index'
import Rules from './Rules/Rules'
import StyleEditor from './StyleEditor/index'

export default (app: any) => {
  app.component('FormDesign-InitialValues', InitialValues)
  app.component('FormDesign-GlobalStyle', GlobalStyle)
  app.component('FormDesign-StyleEditor', StyleEditor)
  app.component('FormDesign-JsExpr', JsExpr)
  app.component('FormDesign-Rules', Rules)
  app.component('FormDesign-Linkages', Linkages)
  app.component('FormDesign-Basic', Basic)
  app.component('FormDesign-Options', Options)
}
