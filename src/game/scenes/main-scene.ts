
import 'phaser';
import { 
    PlayerObject, PlayerObjectResourceLoader,
    PoopBombObject, PoopBombObjectResourceLoader 
} from '../objects';
import { emit, listen, ConnectionManager } from './../connection-manager'


export class MainScene extends Phaser.Scene {

    private connection = ConnectionManager.create()
    private player: PlayerObject
    private players: Map<string, PlayerObject> = new Map();

    constructor() {
        super({
            key: "MainScene"
        });
    }

    public init(data: any) {
        debugger;
     }

    public preload(): void {
        PoopBombObjectResourceLoader.load(this);
        PlayerObjectResourceLoader.load(this);
    }

    public create(): void {

        this.player = new PlayerObject(this, {spriteKey: 'bird', x: 20, y: 100, depth: 1})
        this.players.set(this.connection.socketId, this.player);

        emit.NewPlayerEvent(this.player);
        listen.UpdatePlayersEvent(this.players, this);
        listen.PlayerDisconnectEvent(this.players, this);

        this.cameraSetup(0, 0, Number(this.game.config.width), Number(this.game.config.height), this.player.sprite);
        this.matter.world.setBounds(0, 0, Number(this.game.config.width), Number(this.game.config.height));
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
