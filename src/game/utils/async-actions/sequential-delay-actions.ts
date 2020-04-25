import { asyncSetTimeout } from "./async-set-timeout";

export class SequentialDelayActions {

    constructor() { }

    public async run(sequentialActions: Array<{ action: Function, delay: number}>) {
        for(let {action, delay} of sequentialActions) {
            await asyncSetTimeout(delay, action);
        }
    }

   
}