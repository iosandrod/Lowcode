import { reactive } from "vue";

export class Base {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {
        return reactive(this)//
    }
}