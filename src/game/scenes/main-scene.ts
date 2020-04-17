/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 - 2019 digitsensitive
 * @license      {@link https://github.com/digitsensitive/phaser3-typescript/blob/master/LICENSE.md | MIT License}
 */

import 'phaser';

import * as matterJs from 'matter-js';
import { PlayerObject, PlayerObjectResourceLoader } from '../objects/player.object';
import { BombObject, BombObjectResourceLoader } from '../objects/bomb.object';

import { newPlayerEvent } from './../socket-events/new-player.event'
import { updatePlayersEvent } from './../socket-events/update-player.event'
import { Socket } from 'socket.io';

import {config} from '../config';


declare const io;

export class MainScene extends Phaser.Scene {

    protected socket: Socket;
    private phaserSprite: Phaser.GameObjects.Sprite;
    private player: PlayerObject
    private platform: Phaser.Physics.Matter.Sprite

    private otherPlayers: Map<string, PlayerObject> = new Map();

    constructor() {
        super({
            key: "MainScene"
        });
    }

    preload(): void {
  
 
        this.load.image('ground', './../assets/platform.png');

        // this.load.spritesheet(
        //     'bomb-blast', 
        //     './../assets/blast-shoot-sprite.png', 
        //     { frameWidth: 160, frameHeight: 160, }
        // );
        BombObjectResourceLoader.load(this);
        PlayerObjectResourceLoader.load(this)

        //   this.load.image("myImage", "../assets/phaser.png");
    }

    create(): void {
        // this.player = new PlayerObject(this, {
        //     spriteKey: 'bird', x: 20, y: 100, depth: 1
        // });
        const serverAddress  = config['SERVER']['ADDRESS'];
        this.socket = io(serverAddress);



        this.player = new PlayerObject(this, {
            spriteKey: 'bird', x: 20, y: 100, depth: 1
        }, this.socket)

        newPlayerEvent(this.socket, this.player)
        updatePlayersEvent(this.socket, this.otherPlayers, this)


        // new BombObject(
        //     this, 
        //    { x: 100, y: 100, depth: 1 },
        //    this.socket
        // )
        this.cameraSetup(0, 0, Number(this.game.config.width), Number(this.game.config.height), this.player.sprite);
        this.matter.world.setBounds(0, 0, Number(this.game.config.width), Number(this.game.config.height));

    }

    public update(): void { 
        
    }

    private cameraSetup(x: number, y: number, width: number, height: number, target: Phaser.GameObjects.GameObject) {
        const camera = this.cameras.main;
        camera.startFollow(target, false, 0.5, 0.5);
        camera.backgroundColor = new Phaser.Display.Color(153, 225, 255); // rgb(153, 225, 255) = sky color
        // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
        camera.setBounds(x, y, width, height);
    }

    private playerMovementInterpolation(otherPlayers: Map<string, PlayerObject>) {
        for (let id in otherPlayers) {
        //   let player = otherPlayers.get(id)
        //   if (player.target_x !== undefined) {
        //     // Interpolate the player's position
        //     player.sprite.body.x += (player.target_x - player.sprite.body.x) * 0.30
        //     player.sprite.body.y += (player.target_y - player.sprite.body.y) * 0.30
      
        //     let angle = player.target_rotation
        //     let direction = (angle - player.sprite.body.rotation) / (Math.PI * 2)
        //     direction -= Math.round(direction)
        //     direction *= Math.PI * 2
        //     player.sprite.body.rotation += direction * 0.30
      
        //     // Interpolate the player's name position
        //     player.playerName.x += (player.playerName.target_x - player.playerName.x) * 0.30
        //     player.playerName.y += (player.playerName.target_y - player.playerName.y) * 0.30
      
        //     // Interpolate the player's speed text position
        //     player.speedText.x += (player.speedText.target_x - player.speedText.x) * 0.30
        //     player.speedText.y += (player.speedText.target_y - player.speedText.y) * 0.30
      
        //     player.updatePlayerStatusText('speed', player.speedText.x, player.speedText.y, player.speedText)
        //   }
        }
      }
}
