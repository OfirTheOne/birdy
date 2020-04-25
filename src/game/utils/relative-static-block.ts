import { Scene, Events } from "phaser";

export class RelativeStaticBlock<T extends MoveableObject> {

    private isDestroyed: boolean = false;
    constructor(
        private scene: Scene, 
        private targetToSyncWith: MoveableObject, 
        public moveableObject: T,
        private xOffset: number, private yOffset: number
    
    ) {

        this.targetToSyncWith.on("update", this.update, this);
        this.targetToSyncWith.once("destroy", this.destroy, this);
        // this.scene.events.on("update", this.update, this);
        // this.scene.events.once("shutdown", this.destroy, this);
        this.scene.events.once("shutdown", this.destroy, this);
    }

    private update() {
        if(
            this.isDestroyed 
            || !this.targetToSyncWith?.position
            || !this.moveableObject?.position
        ) {
            return;
        }
        debugger;
        const {x, y } = this.targetToSyncWith;
        this.moveableObject.setX(x + this.xOffset);
        this.moveableObject.setY(y + this.yOffset);
    }

    private destroy() {
        this.isDestroyed = true;
        if(this.moveableObject) {
            this.moveableObject.destroy()
        }
    }
}



export interface MoveableObject extends Events.EventEmitter {
    x: number; 
    y: number; 
    setX: (x: number)=>any; 
    setY: (y: number)=>any; 
    destroy:()=>any;
    position?: any
}