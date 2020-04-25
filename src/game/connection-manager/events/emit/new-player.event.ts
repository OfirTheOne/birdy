



import { ConnectionManager } from './../../connection-manager'
import { PlayerObject } from '../../../objects';


export const NewPlayerEvent = (player: PlayerObject) => {
  const connection = ConnectionManager.create()
  return connection.emit('new-player', player.getObjectState())
}