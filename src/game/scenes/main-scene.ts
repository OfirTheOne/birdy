/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 - 2019 digitsensitive
 * @license      {@link https://github.com/digitsensitive/phaser3-typescript/blob/master/LICENSE.md | MIT License}
 */

import 'phaser';
import * as matterJs from 'matter-js';
import { PlayerObject } from '../objects/player.object';

export class MainScene extends Phaser.Scene {
    private phaserSprite: Phaser.GameObjects.Sprite;
    private player: PlayerObject
    private platform: Phaser.Physics.Matter.Sprite

    constructor() {
        super({
            key: "MainScene"
        });
    }

    preload(): void {
        this.load.image('ground', './../assets/platform.png');

        this.load.spritesheet('bird',
            './../assets/sprite-sheet-bird-build-scale.png',
            { frameWidth: 100, frameHeight: 68, }
        );
        //   this.load.image("myImage", "../assets/phaser.png");
    }

    create(): void {
        this.player = new PlayerObject(this, {
            spriteKey: 'bird', x: 20, y: 100, depth: 1
        });
        debugger;
        // this.platform = this.matter.add.sprite(0, 0, 'ground', 0);
        // const mainBody = matterJs.Bodies.rectangle(10, 10, 460, 120);
        // debugger;
        // this.platform.setExistingBody(mainBody);
        // this.platform.setPosition(10, 10);
        // this.platform.setStatic(true);
        // this.platform.setIgnoreGravity(true);

        // this.platforms = (this.matter.body as any).create();
        // const groundBody = 
        // const platform = this.matter.add.rectangle(0, 0, 0, 0, {});
        // const mainBody = matterJs.Bodies.rectangle(10, 10,460, 120);
        // platform
        // platform.setPosition(x, y);
        // platform.setStatic(true);
        // platform.setIgnoreGravity(true);

        // this.matter.platforms.create(70, 500, 'ground').setScale(2).refreshBody();

        // this.player = this.physics.add.sprite(100, 450, 'bird');
        // this.player.setBounce(0.2);
        // this.player.setCollideWorldBounds(true);

        // this.anims.create({
        //     key: 'left',
        //     frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 3 }),
        //     frameRate: 10,
        //     repeat: -1
        // });

        // this.anims.create({
        //     key: 'turn',
        //     frames: [{ key: 'dude', frame: 4 }],
        //     frameRate: 20
        // });

        // this.anims.create({
        //     key: 'right',
        //     frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        //     frameRate: 10,
        //     repeat: -1
        // });

        // this.setFinishPoint({ x: finishPoint['x'], y: finishPoint['y'] });
        // this.scoreTextSetup({ initCoin: 0, initDiamond: 0 });
        this.cameraSetup(0, 0, 600, 500, this.player.sprite);
        this.matter.world.setBounds(0, 0, 600, 500);

        // this.matter.world.on('collisionstart', this.handlePlayerCollision, this);
        // this.matter.world.on('collisionactive', this.handlePlayerCollision, this);

        // this.physics.world.addCollider(this.player, platform);
        // this.phaserSprite = this.add.sprite(400, 300, "myImage");
    }

    public update(): void { }

    private cameraSetup(x: number, y: number, width: number, height: number, target: Phaser.GameObjects.GameObject) {
        const camera = this.cameras.main;
        camera.startFollow(target, false, 0.5, 0.5);
        camera.backgroundColor = new Phaser.Display.Color(153, 225, 255); // rgb(153, 225, 255) = sky color
        // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
        camera.setBounds(x, y, width, height);
    }

}
