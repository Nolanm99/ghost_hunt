const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const socketio = require('socket.io');
const server = http.createServer(app);
const io = socketio(server)
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const passportSetup = require('./config/passport-setup');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const keys = require('./config/keys');
const server_constants = require('./serverJS/server_constants.js');
const crypto = require('crypto');


//Load dependencies
var serverIntermittentFunctions = require('./serverJS/serverIntermittentFunctions.js');
var connectionList = [];
var playerList = [];
var aiStateList = [];
var roomList = [];

app.set('view engine', 'ejs')
app.use('/public/', express.static(path.join(__dirname, 'public')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/js/')))
app.use('/three/', express.static(path.join(__dirname, 'node_modules/three/build/')))

app.use(cookieSession({
    maxAge:server_constants.server_settings.COOKIE_MAX_AGE,
    keys: [keys.session.cookieKey]
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(keys.mongodb.dbURL, () => {
    console.log('connected to database.')
})

app.use('/auth',authRoutes);
app.use('/profile',profileRoutes);

app.get('/', (req,res) => {
    res.render('home', {user: req.user});
})


//Import classes
var serverClasses = require('./serverJS/classes.js');




roomList.push(new serverClasses.Room(crypto.randomBytes(15).toString('hex')));

//On client connection
io.on('connection', socket => {
    console.log('New Connection: ', socket.id);
    connectionList.push(new serverClasses.Connection(socket.id));
    console.log('Current Connections: ', connectionList);

    //When someone hits the new player button
    socket.on('new player', (connectionID, color)=> {
        newPlayer = new serverClasses.Player(connectionID, color)
        playerList.push(newPlayer);

        

        //Find a room to put the player in
        roomList.forEach(room => {
            if(room.playerList.length < room.MAX_PLAYERS && newPlayer.roomID == 0 && room.roomStatus ==0) {
                //Send the room's player list for synchronization
                socket.emit('player sync', room.playerList);

                room.playerList.push(newPlayer);
                newPlayer.roomID = room.roomID;
                socket.join(room.roomID)

                //Send the game settings to the client.
                io.to(socket.id).emit('game settings', server_constants.game_settings, room.roomID);

                console.log('New Player Created: ', connectionID, color)
                socket.to(newPlayer.roomID).emit('new player', connectionID, color);
            }
        })

        //If all of the current rooms are full, make a new room and put the player in it
        if(newPlayer.roomID == 0) {
            //Send the room's player list for synchronization
            //newRoomID = roomList.length + 1;
            newRoomID = crypto.randomBytes(15).toString('hex');
            newRoom = new serverClasses.Room(newRoomID);
            socket.emit('player sync', newRoom.playerList);

            //Send the game settings to the client.
            io.to(socket.id).emit('game settings', server_constants.game_settings,newRoomID);
            
            roomList.push(newRoom);
            newRoom.playerList.push(newPlayer);
            newPlayer.roomID = newRoom.roomID;
            socket.join(newRoom.roomID)
        }

        
    });

   

    //When a player moves their position
    socket.on('player movement', (connectionID, direction)=> {
        selectedPlayer = playerList.find(obj=>obj.socketID==connectionID);
        selectedRoom = roomList.find(room => room.roomID == selectedPlayer.roomID);

        if(direction == 1) {
            selectedPlayer.Yposition += server_constants.game_settings.PLAYER_VELOCITY;
        }
        else if(direction == 2) {
            selectedPlayer.Xposition -= server_constants.game_settings.PLAYER_VELOCITY;
        }
        else if(direction == 3) {
            selectedPlayer.Yposition -= server_constants.game_settings.PLAYER_VELOCITY;
        }
        else if(direction == 4) {
            selectedPlayer.Xposition += server_constants.game_settings.PLAYER_VELOCITY;
        }

        if (Math.abs(selectedPlayer.Xposition) > server_constants.game_settings.MAP_X_EXTENTS/2 || Math.abs(selectedPlayer.Yposition) > server_constants.game_settings.MAP_Y_EXTENTS/2) {
            if (selectedPlayer.Xposition > server_constants.game_settings.MAP_X_EXTENTS/2) selectedPlayer.Xposition = server_constants.game_settings.MAP_X_EXTENTS/2;
            else if (selectedPlayer.Xposition < -1*server_constants.game_settings.MAP_X_EXTENTS/2) selectedPlayer.Xposition = -1*server_constants.game_settings.MAP_X_EXTENTS/2;
            else if (selectedPlayer.Yposition > server_constants.game_settings.MAP_Y_EXTENTS/2) selectedPlayer.Yposition = server_constants.game_settings.MAP_Y_EXTENTS/2;
            else if (selectedPlayer.Yposition < -1*server_constants.game_settings.MAP_Y_EXTENTS/2) selectedPlayer.Yposition = -1*server_constants.game_settings.MAP_Y_EXTENTS/2;

            io.to(selectedRoom.roomID).emit('player movement', connectionID, selectedPlayer.Xposition, selectedPlayer.Yposition);
        }

        //Send player movement data to players in the same room
        socket.to(selectedRoom.roomID).emit('player movement', connectionID, selectedPlayer.Xposition, selectedPlayer.Yposition);
    });

    socket.on('ai position update', (socketID, position) => {
        selectedPlayer = playerList.find(obj=>obj.socketID==socketID);
        if(typeof selectedPlayer !== 'undefined') {
            selectedPlayer.Xposition = position.x;
            selectedPlayer.Yposition = position.y;
        }
    })

    socket.on('player flashlight on', (socketID)=> {
        selectedPlayer = playerList.find(obj=>obj.socketID==socketID);
        if(selectedPlayer) {
            selectedRoom = roomList.find(room => room.roomID == selectedPlayer.roomID);
        }
        if(typeof selectedPlayer !== 'undefined') {
            if(selectedPlayer.flashlightLockoutTimer == false) {
                if(selectedPlayer.flashlightBatteryLevel > 0 ) {
                    selectedPlayer.flashLightStatus = true;
                    io.to(selectedRoom.roomID).emit('player flashlight on', socketID, selectedPlayer.flashlightBatteryLevel);
                }
                else {
                    selectedPlayer.flashlightLockoutTimer = true;
                    setTimeout(function() {selectedPlayer.flashlightLockoutTimer = false; }, 2000);
                    selectedPlayer.flashLightStatus = false;
                    io.to(selectedRoom.roomID).emit('player flashlight off', socketID, selectedPlayer.flashlightBatteryLevel);
                }
            }
            
            selectedPlayer.flashlightBatteryLevel -= 1;
            if(selectedPlayer.flashlightBatteryLevel < 0) {selectedPlayer.flashlightBatteryLevel = 0;}
        }
    });

    socket.on('player flashlight off', (socketID)=> {
        selectedPlayer = playerList.find(obj=>obj.socketID==socketID);
        selectedRoom = roomList.find(room => room.roomID == selectedPlayer.roomID);
        selectedPlayer.flashLightStatus = false;
        io.to(selectedRoom.roomID).emit('player flashlight off', socketID);
    });

    socket.on('player rotation', (socketID, newAngle)=> {
        selectedPlayer = playerList.find(obj=>obj.socketID==socketID);
        selectedRoom = roomList.find(room => room.roomID == selectedPlayer.roomID);
        selectedPlayer.rotationAngle = newAngle;
        
        io.to(selectedRoom.roomID).emit('player rotation', socketID, newAngle);
    });

    socket.on('player illuminated', (roomID, socketID, illuminatedStatus)=> {
        console.log(`PLAYER ILLUMINATED. socket: ${socketID}`)

        selectedRoom = roomList.find(obj=>obj.roomID == roomID);
        illuminatedPlayer = selectedRoom.playerList.find(obj=>obj.socketID==socketID);
        //console.log(illuminatedPlayer)
        selectedRoom = roomList.find(room => room.roomID == illuminatedPlayer.roomID);

        if(illuminatedPlayer.illuminated == false) {
            illuminatedPlayer.illuminated = illuminatedStatus;

            //Subtract health from player
            illuminatedPlayer.healthLevel -= 20;
            console.log(`sending new health level to ${illuminatedPlayer.socketID}, ${illuminatedPlayer.healthLevel}`)
            io.to(illuminatedPlayer.socketID).emit('health status', illuminatedPlayer.healthLevel);

            //GAME OVER IF GHOST DIES
            if(illuminatedPlayer.healthLevel <= 0) {
                selectedRoom.roomStatus = 2; //GAME OVER
                io.to(illuminatedPlayer.roomID).emit('game over');
            }


            io.to(illuminatedPlayer.roomID).emit('player illuminated', socketID, illuminatedStatus);
            setTimeout(function() {
                illuminatedPlayer.illuminated = false;
                io.to(illuminatedPlayer.roomID).emit('player illuminated', socketID, false);
            }, 2000); //flip back color after 1 seconds
        }
    });

    //When the client disconnects
    socket.on('disconnect', ()=> {
        selectedPlayer = playerList.find(obj=>obj.socketID==socket.id);
        if(selectedPlayer) {
            selectedRoom = roomList.find(room => room.roomID == selectedPlayer.roomID);
            
            //socket.broadcast.emit('player disconnect', socket.id);
            io.to(selectedRoom.roomID).emit('player disconnect', socket.id);

            selectedRoom.playerList = selectedRoom.playerList.filter(obj => {
                return obj.socketID != socket.id;
            });

            //Reset the room status (back to waiting for players)
            if(selectedRoom.playerList.length == 0) {
                console.log(`players in room ${selectedRoom.roomID}: ${selectedRoom.playerList.length}, setting back to pregame lobby`)
                selectedRoom.roomStatus = 0;
            }
        }
        
        console.log('DISCONNECTED: ', socket.id)
        connectionList = connectionList.filter(obj => {
            return obj.socketID != socket.id;
        });
        playerList = playerList.filter(obj => {
            return obj.socketID != socket.id;
        });

    });
    setInterval(serverIntermittentFunctions.chargeBatteriesWhileFlashlightOff, 100, playerList);
    setInterval(serverIntermittentFunctions.updateBatteryStatus, 100, playerList, io);
});

setInterval(printRoomsStatus, 2000);
setInterval(addAiAgentIfNeeded, 500);
setInterval(startGameIfNeeded, 500);
setInterval(calculateAiStates, 100);

setInterval(SetDeactivatedStatusOnRooms,5000);
setInterval(RemoveDeactivatedRooms,5000);




server.listen(server_constants.server_settings.PORT, "0.0.0.0", ()=> {
    console.log(`Server running on port ${server_constants.server_settings.PORT}`);
});






function SetDeactivatedStatusOnRooms() {
    roomList.forEach(room=> {
        humansInRoom = room.playerList.filter(obj=> {return obj.socketID.search("ai_") == -1;});
        aiPlayersInRoom = room.playerList.filter(obj=> {return obj.socketID.search("ai_") !== -1;});
        if(aiPlayersInRoom.length > 0 && humansInRoom.length == 0) {
            room.deactivated = true;
        }
    })
}

function RemoveDeactivatedRooms() {
    console.log(`Removing deactivated rooms.`)
    roomList = roomList.filter(obj=> {
        return obj.deactivated == false;
    })
}
function printRoomsStatus() {
    console.log('\nCurrent # of Rooms: ', roomList.length);
    roomList.forEach(room => {
        console.log('Room', room.roomID, 'players:', room.playerList.length);
        room.playerList.forEach(player=>{console.log(player.socketID)})
        console.log('\n')
    });
    
}

function addAiAgentIfNeeded() {
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
}

function startGameIfNeeded() {
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
                room.playerList.forEach(playerSelectedForNewPostion => {
                    io.to(room.roomID).emit('player movement', playerSelectedForNewPostion.socketID, playerSelectedForNewPostion.Xposition, playerSelectedForNewPostion.Yposition);
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
}

function calculateAiStates () {
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
}