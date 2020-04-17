export interface TransferredPlayer {

    x: number;
    y: number;
    moveForce: number;
    velocity: any;
    
    // isDownKeyDown: boolean;
    isPlayerOnGround: boolean;
    isLeftKeyDown: boolean;
    isRightKeyDown: boolean;
    isJumpKeyDown: boolean;
    isFireKeyDown: boolean;
    name: string;
}