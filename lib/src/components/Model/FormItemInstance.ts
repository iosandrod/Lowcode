import { Base } from "./Base";

export class FormItemInstance extends Base {
    props: any
    emits: any
    constructor(props: any, emits: any) {
        super()//
        this.props = props
        this.emits = emits
    }
}