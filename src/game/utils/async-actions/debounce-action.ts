export class DebounceAction {


    protected canExecute: boolean = true;
    protected timerRef: NodeJS.Timeout;
    
    constructor(protected delay: number) { }

    public run(action: Function) {
        if(this.canExecute) {
            this.canExecute = false;
            action();
            this.initTimer(this.delay);
        }
    }

    protected initTimer(delay: number) {
        this.timerRef = setTimeout(() => {
            this.canExecute = true;
            clearTimeout(this.timerRef);
        }, delay);
        
    }
}