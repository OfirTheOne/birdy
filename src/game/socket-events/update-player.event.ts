import { PlayerObject } from './../objects/player.object';
import { Socket } from 'socket.io';
import { Scene } from 'phaser'
import { TransferredPlayer } from '../models/transferred-player';
import { Dictionary } from 'ts-essentials';
// import { createText } from '../utils'

export const updatePlayersEvent = (socket: Socket, otherPlayers: Map<string, PlayerObject>, scene: Scene) => {
  socket.on('update-players', (playersData: Dictionary<TransferredPlayer>) => {
    let playersFound = {}
    // Iterate over all players
    for (let index in playersData) {
      const { x, y } = playersData[index]
      // In case a player hasn't been created yet
      // We make sure that we won't create a second instance of it
      if ((!otherPlayers.has(index)) && index !== socket.id) {
        const newPlayer = new PlayerObject(scene, { x, y, currentUser: false }, socket)
        newPlayer.playerNameObject = PlayerObject.createText(scene, newPlayer.sprite, socket.id)
        // newPlayer.speedText = createText(game, newPlayer)
        // newPlayer.updatePlayerName(playerName, x, y)
        otherPlayers.set(index, newPlayer)
      }

      playersFound[index] = true

      // Update players data
      if (index !== socket.id) {
        // Update players target but not their real position
        otherPlayers.get(index).syncPlayer(playersData[index])
        // otherPlayers.get(index).sprite.setY(y)
        // otherPlayers.get(index).sprite.r = angle

        // otherPlayers.get(index).playerName.target_x = data.playerName.x
        // otherPlayers.get(index).playerName.target_y = data.playerName.y

        // otherPlayers.get(index).speedText.target_x = data.speed.x
        // otherPlayers.get(index).speedText.target_y = data.speed.y

        // otherPlayers[index].speed = data.speed.value
      }
    }

    // Check if there's no missing players, if there is, delete them
    for (let id of otherPlayers.keys()) {
      if (!playersFound[id]) {

        otherPlayers.get(id).sprite.destroy();
        // otherPlayers[id].playerName.destroy()
        // otherPlayers[id].speedText.destroy()
        otherPlayers.delete(id)
      }
    }
  })
}

