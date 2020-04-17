

import { Socket } from 'socket.io'
import { PlayerObject } from '../objects/player.object'


export const newPlayerEvent = (socket: Socket, player: PlayerObject) => {
    socket.on('connect', () => {
      socket.emit('new-player', 
      player.getTransferredPlayerData()
      /*
      {
        x: player.sprite.x,
        y: player.sprite.y,
        angle: player.sprite.rotation,
        playerName: String(socket.id),
        //  {
        //   name: 
        //   x: 3, //player.playerName.x,
        //   y: 8. //player.playerName.y
        // },
        // speed: {
        //   value: player.speed,
        //   x: 20, //player.speed.x,
        //   y: 50, //player.speed.y
        // }
      }
      */
     )
    })
  }