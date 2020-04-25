export class DelayAction {

    protected timerRef: NodeJS.Timeout;
    
    constructor(protected delay: number) { }

    public run(action: Function) {
        this.initTimer(this.delay, action);
    }

    protected initTimer(delay: number, action: Function) {
        this.timerRef = setTimeout(() => {
            action();
            clearTimeout(this.timerRef);
        }, delay);
        
    }
}


