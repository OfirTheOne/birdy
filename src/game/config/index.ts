export const config = {


    "SERVER" : {
        "ADDRESS": "0.0.0.0:8000"
    },

    "GAME_OBJECT": {

        "POOP_BOMB" : {
            "DELAY_MS_BLAST_AFTER_HIT" : 100,
            "DELAY_MS_DESTROY_AFTER_BLAST" : 500
        },
        "BIRD_PLAYER": {
            "SPRITE_KEY": 'bird',
            "BASIC_MOVE_FORCE": 0.015, // left right move force
            "THRESHOLD_HORIZONTAL_VELOCITY": 7, // max left right velocity
            "JUMP_VERTICAL_VELOCITY": 9, // constant jump velocity
            "DELAY_MS_BETWEEN_JUMPS": 500,
            "DELAY_MS_BETWEEN_FIRE": 1000
        }
    }
} 