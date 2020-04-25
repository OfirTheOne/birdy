import { PlayerObject } from './../../../objects';
import { Scene } from 'phaser'
import { PlayerObjectState } from '../../../models/player-object-state';
import { Dictionary } from 'ts-essentials';
import { ConnectionManager } from '../../connection-manager';



export const UpdatePlayersEvent = (otherPlayers: Map<string, PlayerObject>, scene: Scene) => {
  const connection = ConnectionManager.create()

  connection.on('update-players', (playersData: Dictionary<PlayerObjectState>) => {
    for (let id in playersData) {
      const { x, y } = playersData[id]
      if ((!otherPlayers.has(id)) && id !== connection.socket.id) {
        const newPlayer = new PlayerObject(scene, { x, y, currentUser: false })
        otherPlayers.set(id, newPlayer)
      }
      otherPlayers.get(id)?.syncPlayer(playersData[id])
    }

    // Check if there's no missing players, if there is, delete them
    // for (let id of otherPlayers.keys()) {
    //   if (!playersFound[id]) {

    //     otherPlayers.get(id).destroy();
    //     otherPlayers.delete(id)
    //   }
    // }
  })
}

