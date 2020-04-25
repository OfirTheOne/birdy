import 'phaser';

import { config } from '../../config';
import { Dictionary } from 'ts-essentials';
import { Body } from 'matter-js';
import { MultiKey } from '../../utils/multi-key';
import { Game, Scene } from 'phaser';
import { PlayerObjectState } from '../../models/player-object-state';
import { PoopBombObject } from './../poop-bomb-object/poop-bomb.object';
import { RelativeStaticBlock } from '../../utils/relative-static-block';
import { ConnectionManager } from '../../connection-manager';
import { DebounceAction } from '../../utils/async-actions';

const playerConfig = config['GAME_OBJECT']['BIRD_PLAYER'];



export class PlayerObjectResourceLoader {
    static load(scene: Phaser.Scene) {
        scene.load.spritesheet('bird',
            './../assets/sprite-sheet-bird-build-scale.png',
            { frameWidth: 100, frameHeight: 68, }
        );
    }
}

/** 
 * @member sprite -
 * the plyer sprite object.
 *
 * @member sensors -
 * 'sensors' / MatterJS.Body serounding the sprite object to trace collisions.
 *
 * @member isTouching -
 * flags for player body touching the serounding,
 * communication between collisions events listening to updating the sprite.
 * 
 * @member keys -
 * keys using to control the player sprite.
 * 
 * @member jumpCoolDownTimer - 
 * 'jumpCoolDownTimer' event object, set the 'canJump' flag to true after 
 * a delay from the last jump action.
 */
export class PlayerObject {

    lastEmittedX: number;
    lastEmittedY: number;

    private connection = ConnectionManager.create()
    public isCurrentUser: boolean;
    public playerName: string;
    public playerNameObject: Phaser.GameObjects.Text;

    public sprite: Phaser.Physics.Matter.Sprite;
    public sensors: { bottom: Body, left: Body, right: Body, top: Body };
    
    private keys: { 
        leftInput: MultiKey; 
        rightInput: MultiKey; 
        jumpInput: MultiKey; 
        runInput: MultiKey, 
        fireInput: MultiKey  
    };
    
    private canJump: boolean;
    // private canFire: boolean;
    private jumpCoolDownTimer: Phaser.Time.TimerEvent;
    // private fireCoolDownTimer: Phaser.Time.TimerEvent;

    private fireDebounceAction : DebounceAction;
    
    private isTouching = { left: false, right: false, ground: false };
    private isDestroyed = false;
    

    private existingBombsList: Array<PoopBombObject> = []

    constructor(private scene: Phaser.Scene, options: PlayerObjectOptions) {
        const { spriteKey = playerConfig.SPRITE_KEY, x, y, depth, currentUser = true } = options;
        this.isCurrentUser = currentUser;
        this.lastEmittedX = x;
        this.lastEmittedY = y;

        // Create the physics-based sprite that we will move around and animate
        this.setupSprite(spriteKey, x, y);
        this.setSpriteAnims(this.scene, spriteKey);

        depth ? this.sprite.setDepth(depth) : undefined;
        this.initKeysInput();

        this.canJump = true;
        // this.canFire = true;
        this.listenToCollisionEvents();
        this.scene.events.on("update", this.update, this);
        this.scene.events.once("shutdown", this.destroy, this);
        this.scene.events.once("destroy", this.destroy, this);
        // this.sprite.on('destroy')

        this.fireDebounceAction = new DebounceAction(playerConfig['DELAY_MS_BETWEEN_FIRE']);
        new RelativeStaticBlock(
            this.scene, this.sprite, 
            this.scene.add.text(x, y+50, this.connection.socketId), 
            -20, -50
        )
    }

    // #region - Basic Public Player Methods -

    public update() {
        if (this.isDestroyed) {
            return;
        }

        const currentState = this.getObjectState()
        const sprite = this.sprite;

        if(this.isCurrentUser) {

            this.existingBombsList = this.existingBombsList.length == 0 ? 
                this.existingBombsList : 
                this.existingBombsList.filter(bomb => bomb.isDestroyed != false)

            if( 
                //sprite['position'] && 
                ((this.lastEmittedX != sprite.x) || (this.lastEmittedY != sprite.y) || this.anyKeyDown())
            ) {
                this.emitPlayerData(currentState)
            }
        }
        this.sprite.emit('update');
    }

    public getObjectState(): PlayerObjectState {

        const sprite = this.sprite;
        
        const velocity = sprite.body?.['velocity'];
        const isPlayerOnGround = this.isTouching.ground;
        const isRunning = this.keys.runInput.isDown();

        const moveForce =
            (isRunning && isPlayerOnGround) ? (playerConfig.BASIC_MOVE_FORCE) * 2 : // whan runnig make moving ligther
                (!isPlayerOnGround ? playerConfig.BASIC_MOVE_FORCE * 0.2 : // on the air make moving heavier
                    playerConfig.BASIC_MOVE_FORCE); // on the ground & not running move normal

                    
        const position = sprite.body?.['position'];
        const { x,y } = position ?  sprite : { x: 0, y: 0 }

        const needToFire = this.keys.fireInput.isDown();// && this.canFire
        return {
            isJumpKeyDown: this.keys.jumpInput.isDown(),
            isLeftKeyDown: this.keys.leftInput.isDown(),
            isRightKeyDown: this.keys.rightInput.isDown(),
            needToFire,
            isPlayerOnGround,
            moveForce,
            velocity,
            name: this.playerName,
            x,
            y
        }
    }

    public syncPlayer(data: PlayerObjectState) {

        // if(!this.isCurrentUser) {
            this.sprite.setX(data.x)
            this.sprite.setY(data.y)
            this.applyObjectState(
                this.sprite,
                data.x,
                data.y,
                data.isLeftKeyDown,
                data.isRightKeyDown,
                data.isJumpKeyDown,
                data.isPlayerOnGround,
                data.needToFire,
                data.moveForce,
                data.velocity
            )

        // }
    }
    private applyObjectState(
        sprite: Phaser.Physics.Matter.Sprite,
        x: number,
        y: number,
        leftKeyDown: boolean,
        rightKeyDown: boolean,
        jumpKeyDown: boolean,
        isPlayerOnGround: boolean,
        needToFire: boolean,
        moveForce: number,
        velocity?: any,
    ) {
        if(!this.isCurrentUser) {
            // debugger;
        }


        // if(!this.anyKeyDown()) {
            sprite.anims.play('move-left', true);
        // }

        if(needToFire) {
            // this.canFire = false;
            this.fireDebounceAction.run(() => {
                const bomb = new PoopBombObject(this.scene, {x, y: (y + this.sprite.height + 10)}, this.connection.socket)
                this.existingBombsList.push(bomb);
            })
                // sprite.setVelocityY(-playerConfig.JUMP_VERTICAL_VELOCITY);
            // this.fireCoolDownTimer = this.scene.time.addEvent({
            //     delay: playerConfig.DELAY_MS_BETWEEN_JUMPS,
            //     callback: () => (this.canFire = true)
            // });
            
        }
        if (leftKeyDown) {
            const animsKey = isPlayerOnGround ? 'move-left' : 'pose-left'
            sprite.anims.play('move-left', true);
            sprite.setFlipX(true);

            sprite.applyForce({ x: -moveForce, y: 0 } as Phaser.Math.Vector2);

        } else if (rightKeyDown) {
            const animsKey = isPlayerOnGround ? 'move-right' : 'pose-right'
            sprite.anims.play('move-right', true);
            sprite.setFlipX(false);

            sprite.applyForce({ x: moveForce, y: 0 } as Phaser.Math.Vector2);

        } else if (isPlayerOnGround) { // if doing noting on the ground
            sprite.setVelocityX(0);
            sprite.anims.play('turn', true);
        }

        if (jumpKeyDown /* && isPlayerOnGround && this.canJump */) {
            sprite.setVelocityY(-playerConfig.JUMP_VERTICAL_VELOCITY);
            this.canJump = false;
            this.jumpCoolDownTimer = this.scene.time.addEvent({
                delay: playerConfig.DELAY_MS_BETWEEN_JUMPS,
                callback: () => (this.canJump = true)
            });
        }
        

        // limit horizontal speed
        if(velocity != undefined) {
            if (velocity.x > playerConfig.THRESHOLD_HORIZONTAL_VELOCITY) {
                sprite.setVelocityX(playerConfig.THRESHOLD_HORIZONTAL_VELOCITY);
            }
            else if (velocity.x < -playerConfig.THRESHOLD_HORIZONTAL_VELOCITY) {
                sprite.setVelocityX(-playerConfig.THRESHOLD_HORIZONTAL_VELOCITY);
            }

        }
    }
    public destroy() {
        if (this.scene.matter.world) {
            this.scene.matter.world.off("beforeupdate", this.resetTouching, this, false);
            // this.scene.matter.world.off("collisionstart", this.handlePlayerCollision, this, false);
            // this.scene.matter.world.off("collisionactive", this.handlePlayerCollision, this, false);
        }

        if (this.jumpCoolDownTimer) {
            this.jumpCoolDownTimer.destroy()
        };
        // if (this.fireCoolDownTimer) {
        //     this.fireCoolDownTimer.destroy()
        // };

        this.scene.events.off("update", this.update, this, false);
        this.scene.events.off("destroy", this.destroy, this, false);
        this.scene.events.off("shutdown", this.destroy, this, false);

        this.isDestroyed = true;

        if (this.playerNameObject && this.playerNameObject.destroy) {
            this.playerNameObject.destroy()
        }

        this.sprite.destroy();
        this.sprite.emit('destroy');
    }

    public freeze() {
        this.sprite.setStatic(true);
    }

    public isSensor(body) {
        return body === this.sensors.top
            || body === this.sensors.bottom
            || body === this.sensors.left
            || body === this.sensors.right;
    }



    // #endregion


    private anyKeyDown() {
        const anyKeyDown = (
            this.keys.leftInput.isDown() || 
            this.keys.rightInput.isDown() ||
            this.keys.jumpInput.isDown());
        return anyKeyDown;
    }
    private initKeysInput() {
        const { LEFT, RIGHT, UP, A, D, W, SHIFT, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = {
            leftInput: new MultiKey(this.scene, [LEFT, A]),
            rightInput: new MultiKey(this.scene, [RIGHT, D]),
            jumpInput: new MultiKey(this.scene, [UP, W]),
            runInput: new MultiKey(this.scene, [SHIFT]),
            fireInput: new MultiKey(this.scene, [SPACE]),
        }
    }

    private setupSprite(spriteKey: string, x: number, y: number) {
        this.sprite = this.scene.matter.add.sprite(10, 10, spriteKey, 0);

        const { width, height } = this.sprite;
        const compoundBody = this.createSpriteBody(width, height);
        this.sprite.setExistingBody(compoundBody);
        this.sprite.setFixedRotation(); // Sets inertia to infinity so the player can't rotate
        this.sprite.setPosition(x, y);
        this.sprite.setBounce(0.2);
    }

    private createSpriteBody(width: number, height: number): MatterJS.Body {
        // Native Matter modules, Matter.Body Matter.Bodies fail type checking 
        const { Bodies, Body } = Phaser.Physics.Matter['Matter'];
        const mainBody = Bodies.rectangle(0, 0, width * 0.7, height * 0.9, { chamfer: { radius: 10 } });
        this.sensors = {
            bottom: Bodies.rectangle(0, height * 0.45, width * 0.25, 2, { isSensor: true }),
            top: Bodies.rectangle(0, -height * 0.45, width * 0.5, 2, { isSensor: true }),
            left: Bodies.rectangle(-width * 0.35, 0, 2, height * 0.75, { isSensor: true }),
            right: Bodies.rectangle(width * 0.35, 0, 2, height * 0.75, { isSensor: true }),
        };


        const compoundBody: MatterJS.Body = Body.create({
            parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.top, this.sensors.right],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.2
        });
        return compoundBody;

    }

    private setSpriteAnims(scene: Phaser.Scene, spriteKey: string) {
        scene.anims.create({
            key: 'move-right',
            frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 7 }),
            frameRate: 15,
            repeat: -1
        });
        scene.anims.create({
            key: 'move-left',
            frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 7 }),
            frameRate: 15,
            repeat: -1
        });


        scene.anims.create({
            key: 'speed-move-right',
            frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 7 }),
            frameRate: 25,
            repeat: -1
        });
        scene.anims.create({
            key: 'speed-move-left',
            frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 7 }),
            frameRate: 25,
            repeat: -1
        });
        scene.anims.create({
            key: 'pose-right',
            frames: [{ key: spriteKey, frame: 1 }],
            frameRate: 10
        });

        scene.anims.create({
            key: 'turn',
            frames: [{ key: spriteKey, frame: 4 }],
            frameRate: 10,

        });


        scene.anims.create({
            key: 'pose-left',
            frames: [{ key: spriteKey, frame: 3 }],
            frameRate: 10
        });
    }


    private listenToCollisionEvents() {
        // reset this isTouching flags before any collision event.
        this.scene.matter.world.on("beforeupdate", this.resetTouching, this);
        this.scene.matter.world.on("collisionstart", this.handlePlayerCollision, this);
        this.scene.matter.world.on("collisionactive", this.handlePlayerCollision, this);

    }

    private resetTouching() {
        this.isTouching.ground = false;
        this.isTouching.left = false;
        this.isTouching.right = false;
    }

    private handlePlayerCollision(event) {

        const isBodyMatterTileBody = (body) => {
            return body.gameObject &&
                body.gameObject instanceof Phaser.Physics.Matter.TileBody;
        }

        const isBodySensor = (body) => {
            return body === this.sensors.bottom ||
                body === this.sensors.left ||
                body === this.sensors.right;
        }

        const orderBodies: (bodyA: Body, bodyB: Body) => { playerBody: Body, otherBody: Body } = (bodyA, bodyB) => {
            return isBodySensor(bodyA) ? { playerBody: bodyA, otherBody: bodyB } :
                (isBodySensor(bodyB) ? { playerBody: bodyB, otherBody: bodyA } : undefined)

        }

        const traceGroundTouch = (playerBody, otherBody, pair) => {
            const playerLegs = playerBody == this.sensors.bottom;
            const isTouchGround = isBodyMatterTileBody(otherBody);

            if (playerLegs && isTouchGround) {
                this.isTouching.ground = true;
            }
        }

        const traceSidesTouch = (playerBody, otherBody, pair) => {
            if (playerBody == this.sensors.left && isBodyMatterTileBody(otherBody)) {
                this.isTouching.left = true;
                if (pair.separation > 0.5) {
                    this.sprite.x += pair.separation - 0.5;
                }
            } else if (playerBody == this.sensors.right && isBodyMatterTileBody(otherBody)) {
                this.isTouching.right = true;
                if (pair.separation > 0.5) {
                    this.sprite.x -= pair.separation - 0.5;
                }
            }
        }

        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            const bodies = orderBodies(bodyA, bodyB);
            if (!bodies) {
                return;
            }

            const { playerBody, otherBody } = bodies;
            traceGroundTouch(playerBody, otherBody, pair);
            traceSidesTouch(playerBody, otherBody, pair);
        });
    }

    public emitPlayerData(objectState: PlayerObjectState) {
        // Emit the 'move-player' event, updating the player's data on the server
        this.connection.emit('change-player-state', objectState)
    }

}

export interface PlayerObjectOptions {
    spriteKey?: string,
    x: number,
    y: number,
    depth?: number,
    currentUser?: boolean
}