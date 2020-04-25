import { config } from './../config';
import { Socket } from 'socket.io';
declare const io;


type EventType     
    = 'connect' 
    | 'disconnect'
    | 'change-player-state'
    | 'update-players'
    | 'player-disconnect'
    | 'new-player';

export class ConnectionManager {

    static thisInstance: ConnectionManager;

    private _socket: Socket;

    private constructor(host: string) {
        this._socket = io(host)
    }

    static create(host: string = config['SERVER']['ADDRESS']) {
        if(!this.thisInstance) {
            console.log('try to connect')
            this.thisInstance = new ConnectionManager(host)
        }
        return this.thisInstance;
    }

    get socket(): Socket {
        return this._socket;
    }

    get socketId(): string {
        return this.socket.id
    }

    on(event: EventType, listener: (...args: any[]) => void) {
        return this.socket.on(event, listener);
    }

    emit(event: EventType, ...args: any[]) {
        debugger;
        return this.socket.emit(event, ...args);
    }




}