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
        this.MAX_PLAYERS = 2;
        this.playerList = [];
        this.roomID = id;
        this.roomStatus = 0; //0:PREGAME LOBBY, 1:IN GAME, 2: GAME OVER
    }
}

module.exports = {Connection,Player,Room};