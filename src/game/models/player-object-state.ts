export interface PlayerObjectState {

    x: number;
    y: number;
    moveForce: number;
    velocity: any;
    
    // isDownKeyDown: boolean;
    isPlayerOnGround: boolean;
    isLeftKeyDown: boolean;
    isRightKeyDown: boolean;
    isJumpKeyDown: boolean;
    needToFire: boolean;
    name: string;
}