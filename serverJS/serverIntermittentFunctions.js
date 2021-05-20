const crypto = require('crypto');
const serverClasses = require('./classes.js');
const server_constants = require('./server_constants.js');

module.exports = {
    chargeBatteriesWhileFlashlightOff: function(playerList) {
        playersWithFlashlightsOff = playerList.filter(obj=> {
            return obj.flashLightStatus == false;
        })
        if(typeof playersWithFlashlightsOff !== 'undefined') {
            playersWithFlashlightsOff.forEach(player => {
                if(player.flashlightBatteryLevel < 100) { 
                    if(player.flashlightLockoutTimer == false) {
                        player.flashlightBatteryLevel += 1;
                    }
                }
            })
        }
        return playerList
    },
    updateBatteryStatus: function(playerList, io) {
        if(playerList !== 'undefined') {
            playerList.forEach(player => {
                io.to(player.socketID).emit('battery status', player.flashlightBatteryLevel);
            })
        }
    },
    printRoomsStatus: function(roomList) {
        console.log('\nCurrent # of Rooms: ', roomList.length);
        roomList.forEach(room => {
            console.log('Room', room.roomID, 'players:', room.playerList.length);
            room.playerList.forEach(player=>{console.log(player.socketID)})
        });
    },
    sendRoomStatus: function(roomList, io) {
        roomList.forEach(room => {
            //io.to(room.roomID).emit('room status', room);
        })
    },
    aiAgentActions: function(playerList) {
        //filter playerlist to only AI agents
        aiPlayerList = playerList.filter(obj=> {
            return obj.socketID.search("ai_") != -1;
        })
        console.log(aiPlayerList);
    },
    addAiAgentIfNeeded: function(roomList, playerList, io) {
        roomList.forEach(room => {
            //for each room, if the game has not started in 10 seconds, add AI players to fill the room
            timeDelta = (Date.now() - room.timeCreated) / 1000;
            humanPlayerList = room.playerList.filter(obj=> {return obj.socketID.search("ai_") == -1;})

            if(room.playerList.length < room.MAX_PLAYERS && timeDelta > 5 && humanPlayerList.length > 0) {
                //fill the room
                playerDelta = room.MAX_PLAYERS - room.playerList.length;

                for(i=1;i <= playerDelta;i++) {
                    console.log(`ADDING AI PLAYER`)
                    newAIPlayerID = "ai_" + crypto.randomBytes(20).toString('hex');
                    newAIPlayer = new serverClasses.Player(newAIPlayerID, 'rand_color');
                    newAIPlayer.roomID = room.roomID
                    playerList.push(newAIPlayer);
                    room.playerList.push(newAIPlayer);
                    io.to(room.roomID).emit('new ai player', newAIPlayerID);
                }
            }
        })
    },
    startGameIfNeeded: function(roomList, io) {
        roomList.forEach(room=> {
            if(room.playerList.length >= room.MAX_PLAYERS && room.roomStatus == 0) {
                console.log('STARTING GAME FOR ROOM ', room.roomID);
                io.to(room.roomID).emit('game started', roomList);
    
                //Reset player positions
                var playerCounter = 0;
                room.playerList.forEach(player => {
                    player.Xposition = Math.round(Math.cos(playerCounter) * server_constants.game_settings.MAP_X_EXTENTS / 6);
                    player.Yposition = Math.round(Math.sin(playerCounter) * server_constants.game_settings.MAP_Y_EXTENTS / 6);  
                    playerCounter += Math.PI/(room.MAX_PLAYERS-1);
                })
    
                //Send the new positions 0.2 seconds later
                setTimeout(function() {
                    room.playerList.forEach(player => {
                        io.to(room.roomID).emit('player movement', player.socketID, player.Xposition, player.Yposition);
                    })
                }, 200);
    
                //Select a ghost character (human players only)
                humanPlayerList = room.playerList.filter(obj=> {return obj.socketID.search("ai_") == -1;})
                playerIdx = Math.round(Math.random() * (humanPlayerList.length - 1));
                console.log(`player index ${playerIdx}`);
                humanPlayerList[playerIdx].isGhost = true;
                setTimeout(function() {io.to(room.roomID).emit('selected ghost', humanPlayerList[playerIdx].socketID)}, 200);
                
                room.roomStatus = 1;
            }
        })
    } 
}