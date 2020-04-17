export const config = {


    "SERVER" : {
        "ADDRESS": "10.100.102.16:8000" // "0.0.0.0:8000"
    },

    "GAME_OBJECT": {
        "BIRD_PLAYER": {
            "SPRITE_KEY": 'bird',
            "BASIC_MOVE_FORCE": 0.015, // left right move force
            "THRESHOLD_HORIZONTAL_VELOCITY": 7, // max left right velocity
            "JUMP_VERTICAL_VELOCITY": 9, // constant jump velocity
            "DELAY_MS_BETWEEN_JUMPS": 500
        }
    }
} 