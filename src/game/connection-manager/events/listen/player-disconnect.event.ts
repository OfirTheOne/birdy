import { PlayerObject } from './../../../objects';
import { Scene } from 'phaser'
import { ConnectionManager } from '../../connection-manager';



export const PlayerDisconnectEvent = (otherPlayers: Map<string, PlayerObject>, scene: Scene) => {
  const connection = ConnectionManager.create()

  connection.on('player-disconnect', ({playerId}: {playerId: string}) => {
    if (otherPlayers.has(playerId)) {
        otherPlayers.get(playerId).destroy();
        otherPlayers.delete(playerId)
      
    }
  })
}

