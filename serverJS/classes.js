//Construct Classes
class Connection {
    constructor(id) {
        this.socketID = id;
        this.madePlayer = false;
    }
}
class Player {
    constructor(id, color) {
        this.socketID = id;
        this.roomID = 0;
        this.color = color;
        this.Xposition = 0;
        this.Yposition = 0;
        this.flashLightStatus = false;
        this.rotationAngle = 0;
        this.illuminated = false;
        this.flashlightBatteryLevel = 100;
        this.healthLevel = 100;
        this.flashlightLockoutTimer = false;
        this.isGhost = false;
    }
}

class Room {
    constructor(id) {
        this.MAX_PLAYERS = 3;
        this.playerList = [];
        this.roomID = id;
        this.roomStatus = 0; //0:PREGAME LOBBY, 1:IN GAME, 2: GAME OVER
        this.timeCreated = Date.now();
    }
}

class AiState {
    constructor(id,roomID) {
        this.socketID = id;
        this.roomID = roomID;
        this.xMovement = 0;
        this.yMovement = 0;
        this.rotationAngle = 0;
    }
}

module.exports = {Connection,Player,Room,AiState};