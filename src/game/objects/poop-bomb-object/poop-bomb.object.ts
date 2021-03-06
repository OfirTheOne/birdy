import 'phaser';
import { Socket } from 'socket.io';
import { config } from '../../config';
import { Dictionary } from 'ts-essentials';
import { Body } from 'matter-js';
import { MultiKey } from '../../utils/multi-key';
import { Game, Scene } from 'phaser'; 
import { PoopBombObjectState } from '../../models/poop-bomb-object-state';
import { DelayAction, SequentialDelayActions } from '../../utils/async-actions';

const bombConfig = config['GAME_OBJECT']['POOP_BOMB'];


export class PoopBombObjectResourceLoader {


    static load(scene: Phaser.Scene) {

            // Load body shapes from JSON file generated using PhysicsEditor
        scene.load.json('bomb-object-shapes', './../assets/poop-bomb-shape/drop-bomb.json');

        scene.load.spritesheet(
            'bomb-drop', 
            './../assets/boom-drop-sprite.png',
            { frameWidth: 40, frameHeight: 40,  }
        );

        scene.load.spritesheet(
            'bomb-blast', 
            './../assets/blast-shoot-sprite.png', 
            { frameWidth: 160, frameHeight: 160 }
        );
    }
}

export class PoopBombObject {

    lastEmittedX: number;
    lastEmittedY: number;


    private hitAccrued: boolean = false;
    private blastDispatch: boolean = false;

    private shapes: {[key: string]: any};
    public isCurrentUser: boolean;

    public playerName: string;
    public playerNameObject: Phaser.GameObjects.Text;


    public sprite: Phaser.Physics.Matter.Sprite;

    public sensors: { bottom: Body, left: Body, right: Body, top: Body };

    /** @description
     * flags for player body touching the surrounding,
     * communication between collisions events listening to updating the sprite.
     */
    private isTouching = { left: false, right: false, ground: false };

    // ...
    public isDestroyed = false;


    // private selfDestroyOnHitTimer: Phaser.Time.TimerEvent;
    private selfDestroyDelayAction: DelayAction;

    
    private blastDispatchTimer: Phaser.Time.TimerEvent;

    constructor(private scene: Phaser.Scene, options: ObjectOptions, private socket: Socket) {
        const { spriteKey = 'bomb-blast', x, y, depth, currentUser = true } = options;
        this.shapes = this.scene.cache.json.get('bomb-object-shapes');
        this.isCurrentUser = currentUser;
        this.hitAccrued = false;

        this.setupSprite(spriteKey, this.shapes['bomb-drop'], x, y);
        this.setSpriteAnims(this.scene, 'bomb-blast');
        this.listenToCollisionEvents();

        this.scene.events.on("update", this.update, this);
        this.scene.events.once("shutdown", this.destroy, this);
        this.scene.events.once("destroy", this.destroy, this);

        this.selfDestroyDelayAction = new DelayAction(bombConfig['DELAY_MS_DESTROY_AFTER_BLAST'])
    }

    // #region - Basic Public Player Methods -

    public update() {
        if (this.isDestroyed) {
            return;
        }
        const { 
            hitAccrued,
            isDisposed,
            velocity,
            x,
            y
        } =  this.getObjectState();
        const sprite = this.sprite;

        if(this.isCurrentUser) {
            this.applyObjectState(
                sprite, 
                hitAccrued,
                isDisposed,
                velocity
            )
        }
    }

    public getObjectState(): PoopBombObjectState {

        const sprite = this.sprite;
        
        const velocity = sprite.body?.['velocity'];
        const isPlayerOnGround = this.isTouching.ground;

                    
        const position = sprite.body?.['position'];
        const { x,y } = position ?  sprite : { x: 0, y: 0 }
        return {
            hitAccrued: this.hitAccrued,
            isDisposed: this.isDestroyed,
            velocity,
            name: this.playerName,
            x,
            y
        }
    }

     private applyObjectState(
        sprite: Phaser.Physics.Matter.Sprite,
        hitAccrued: boolean,
        isDisposed: boolean,
        velocity?: any,
    ) {
        if(hitAccrued && !isDisposed) {
            this.dispatchBlastAction()
        }

 
    }



    public destroy() {
        if (this.scene.matter.world) {
            this.scene.matter.world.off("beforeupdate", this.resetTouching, this, false);
            // this.scene.matter.world.off("collisionstart", this.handlePlayerCollision, this, false);
            // this.scene.matter.world.off("collisionactive", this.handlePlayerCollision, this, false);
        }

        // if (this.selfDestroyOnHitTimer) {
        //     this.selfDestroyOnHitTimer.destroy()
        // };

        this.scene.events.off("update", this.update, this, false);
        this.scene.events.off("shutdown", this.destroy, this, false);
        this.scene.events.off("destroy", this.destroy, this, false);

        this.isDestroyed = true;

        if (this.playerNameObject && this.playerNameObject.destroy) {
            this.playerNameObject.destroy()
        }

        this.sprite.destroy();
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




    private setupSprite(spriteKey: string, shapeObject: any, x: number, y: number) {
        this.sprite = this.scene.matter.add.sprite(10, 10, 'bomb-drop', null, {shape: shapeObject });

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
            frictionAir: 0.005,
            friction: 0.2
        });
        return compoundBody;

    }

    private setSpriteAnims(scene: Phaser.Scene, spriteKey: string) {
        scene.anims.create({
            key: 'blast',
            frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 7 }),
            frameRate: 12,

        });

        
    }



    private listenToCollisionEvents() {
        // reset this isTouching flags before any collision event.
        this.scene.matter.world.on("beforeupdate", this.resetTouching, this);
        this.scene.matter.world.on("collisionstart", this.handleBodyCollision, this);
        this.scene.matter.world.on("collisionactive", this.handleBodyCollision, this);

    }

    private resetTouching() {
        this.isTouching.ground = false;
        this.isTouching.left = false;
        this.isTouching.right = false;
    }

    private handleBodyCollision(event) {

        // const isBodyMatterTileBody = (body) => {
        //     return body.gameObject &&
        //         body.gameObject instanceof Phaser.Physics.Matter.TileBody;
        // }

        const isBodySensor = (body) => {
            return body === this.sensors.bottom ||
                body === this.sensors.left ||
                body === this.sensors.right;
        }

        const orderBodies: (bodyA: Body, bodyB: Body) => { playerBody: Body, otherBody: Body } = (bodyA, bodyB) => {
            return isBodySensor(bodyA) ? { playerBody: bodyA, otherBody: bodyB } :
                (isBodySensor(bodyB) ? { playerBody: bodyB, otherBody: bodyA } : undefined)

        }

        // const traceGroundTouch = (playerBody, otherBody, pair) => {
        //     const playerLegs = playerBody == this.sensors.bottom;
        //     const isTouchGround = isBodyMatterTileBody(otherBody);

        //     if (playerLegs && isTouchGround) {
        //         this.isTouching.ground = true;
        //     }
        // }

        // const traceSidesTouch = (playerBody, otherBody, pair) => {
        //     if (playerBody == this.sensors.left && isBodyMatterTileBody(otherBody)) {
        //         this.isTouching.left = true;
        //         if (pair.separation > 0.5) {
        //             this.sprite.x += pair.separation - 0.5;
        //         }
        //     } else if (playerBody == this.sensors.right && isBodyMatterTileBody(otherBody)) {
        //         this.isTouching.right = true;
        //         if (pair.separation > 0.5) {
        //             this.sprite.x -= pair.separation - 0.5;
        //         }
        //     }
        // }

        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            const bodies = orderBodies(bodyA, bodyB);
            if (!bodies) {
                return;
            }
            this.hitAccrued = true;
            // traceGroundTouch(playerBody, otherBody, pair);
            // traceSidesTouch(playerBody, otherBody, pair);
        });
    }


    public dispatchBlastAction() {
        if(!this.blastDispatch) {
            this.blastDispatch = true;
            (new SequentialDelayActions()).run([
                {
                    delay: bombConfig.DELAY_MS_BLAST_AFTER_HIT,
                    action: () => (  this.blastAction() ),
                },
                {
                    delay: bombConfig.DELAY_MS_DESTROY_AFTER_BLAST,
                    action: () => (  this.destroy() ),
                },

            ]);
            
        }  
    }
    public blastAction() {
        if(!this.isDestroyed) {            
            this.sprite.anims.play('blast', true);
        }
    }

}

export interface ObjectOptions {
    spriteKey?: string,
    x: number,
    y: number,
    depth?: number,
    currentUser?: boolean
}