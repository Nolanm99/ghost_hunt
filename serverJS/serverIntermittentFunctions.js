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
    calculateAiStates: function(playerList, io, aiStateList) {
        //filter playerlist to only AI agents
        if(playerList.length > 0) {
            
            aiPlayerList = playerList.filter(obj=> {return obj.socketID.search("ai_") != -1;})
            aiPlayerList.forEach(aiPlayer => {
                //find the state for this player
                selectedAiState = aiStateList.find(obj=>obj.socketID == aiPlayer.socketID);
                if(selectedAiState) {
                    if(aiPlayer.isGhost) {
                        //How should a ghost behave


                    }


                    else {
                        //How should a seeker behave
                        newXState = 0;
                        newYState = 0;

                        if(newXState !== selectedAiState.xMovement || newYState !== selectedAiState.yMovement) {
                            selectedAiState.xMovement = newXState;
                            selectedAiState.yMovement = newYState;
                            io.to(aiPlayer.roomID).emit('new ai state', aiPlayer.socketID, selectedAiState);
                        }
                    }
                }    
            })
        }
    },
    addAiAgentIfNeeded: function(roomList, playerList, io, aiStateList) {
        roomList.forEach(room => {
            //for each room, if the game has not started in 10 seconds, add AI players to fill the room
            timeDelta = (Date.now() - room.timeCreated) / 1000;
            humanPlayerList = room.playerList.filter(obj=> {return obj.socketID.search("ai_") == -1;})

            //console.log(`players: ${room.playerList.length}`)
            //console.log(`timedelta: ${timeDelta}`)
            if(room.playerList.length < room.MAX_PLAYERS && timeDelta > 5 && humanPlayerList.length > 0) {
                //fill the room
                playerDelta = room.MAX_PLAYERS - room.playerList.length;

                for(i=1;i <= playerDelta;i++) {
                    console.log(`ADDING AI PLAYER`)
                    newAIPlayerID = "ai_" + crypto.randomBytes(20).toString('hex');
                    newAIPlayer = new serverClasses.Player(newAIPlayerID, 'rand_color');
                    newAIPlayer.roomID = room.roomID;
                    newAIState = new serverClasses.AiState(newAIPlayerID, room.roomID);
                    aiStateList.push(newAIState); 
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
                playerIdx = Math.round(Math.random() * (room.playerList.length - 1));
                room.playerList[playerIdx].isGhost = true;
                setTimeout(function() {io.to(room.roomID).emit('selected ghost', room.playerList[playerIdx].socketID)}, 200);
                
                room.roomStatus = 1;
            }
        })
    },
    endGameIfNeeded: function() {
        roomList.forEach(room=> {
            humansInRoom = room.playerList.filter(obj=> {return obj.socketID.search("ai_") == -1;});
            aiPlayersInRoom = room.playerList.filter(obj=> {return obj.socketID.search("ai_") !== -1;});
            if(aiPlayersInRoom.length > 0 && humansInRoom.length == 0) {
                console.log(roomList);
                roomList = roomList.filter(obj => {
                    return obj.roomID != room.roomID;
                });
                console.log(roomList);
            }
        })
        console.log('returning room list:', roomList)
        //return roomList
    } 
}