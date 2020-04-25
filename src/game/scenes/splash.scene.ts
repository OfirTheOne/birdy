import 'phaser';

import { ConnectionManager } from './../connection-manager'

export class SplashScene extends Phaser.Scene {

    constructor() {
        super({
            key: "SplashScene"
        });
    }

    preload(): void {

    }

    create(): void {
        const connection = ConnectionManager.create();

        this.add.text(Number(this.game.config.width), Number(this.game.config.height), 'Connecting', { 'font-size': '30 px'})

        connection.on('connect', () =>  this.scene.start('MainScene')  )
    }

    public update(): void { }

}
