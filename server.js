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
const keys = require('./config/keys')
const server_constants = require('./serverJS/server_constants.js')

//Load dependencies
var serverIntermittentFunctions = require('./serverJS/serverIntermittentFunctions.js');
var connectionList = [];
var playerList = [];
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
        this.roomStatus = 0; //0:PREGAME LOBBY, 1:IN GAME
    }
}

roomList.push(new Room(1));

//On client connection
io.on('connection', socket => {
    console.log('New Connection: ', socket.id);
    connectionList.push(new Connection(socket.id));
    console.log('Current Connections: ', connectionList);

    //When someone hits the new player button
    socket.on('new player', (connectionID, color)=> {
        newPlayer = new Player(connectionID, color)
        playerList.push(newPlayer);

        if(server_constants.server_settings.DEBUG_MODE) {
            io.to(connectionID).emit('debug mode');
        }

        //Find a room to put the player in
        roomList.forEach(room => {
            if(room.playerList.length < room.MAX_PLAYERS && newPlayer.roomID == 0 && room.roomStatus ==0) {
                //Send the room's player list for synchronization
                socket.emit('player sync', room.playerList);   
                
                room.playerList.push(newPlayer);
                newPlayer.roomID = room.roomID;
                socket.join(room.roomID)

                console.log('New Player Created: ', connectionID, color)
                socket.to(newPlayer.roomID).emit('new player', connectionID, color);

                //If room has reached max players, start the game
                //START GAME///
                if(room.playerList.length == room.MAX_PLAYERS && room.roomStatus == 0) {
                    console.log('STARTING GAME FOR ROOM ', room.roomID);
                    io.to(room.roomID).emit('game started', roomList);

                    //Reset player positions
                    var playerCounter = 0;
                    room.playerList.forEach(player => {

                        player.Xposition = Math.round(Math.cos(playerCounter) * 150);
                        player.Yposition = Math.round(Math.sin(playerCounter) * 150);  
                        playerCounter += Math.PI/(room.MAX_PLAYERS-1);
                    })

                    //Send the new positions 0.2 seconds later
                    setTimeout(function() {
                        room.playerList.forEach(player => {
                            io.to(room.roomID).emit('player movement', player.socketID, player.Xposition, player.Yposition);
                        })
                    }, 200);

                    //Select a ghost character
                    playerIdx = Math.round(Math.random() * (room.MAX_PLAYERS - 1));
                    console.log(`player index ${playerIdx}`);
                    room.playerList[playerIdx].isGhost = true;
                    setTimeout(function() {io.to(room.roomID).emit('selected ghost', room.playerList[playerIdx].socketID)}, 200);
                    
                    room.roomStatus = 1;
                }
            }
        })

        //If all of the current rooms are full, make a new room and put the player in it
        if(newPlayer.roomID == 0) {
            //Send the room's player list for synchronization
            newRoomID = roomList.length + 1;
            newRoom = new Room(newRoomID);
            socket.emit('player sync', newRoom.playerList);   
            
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

    socket.on('player illuminated', (socketID, illuminatedStatus)=> {
        illuminatedPlayer = playerList.find(obj=>obj.socketID==socketID);

        if(illuminatedPlayer.illuminated == false) {
            illuminatedPlayer.illuminated = illuminatedStatus;

            //Subtract health from player
            illuminatedPlayer.healthLevel -= 20;
            console.log(`sending new health level to ${illuminatedPlayer.socketID}, ${illuminatedPlayer.healthLevel}`)
            io.to(illuminatedPlayer.socketID).emit('health status', illuminatedPlayer.healthLevel);

            io.emit('player illuminated', socketID, illuminatedStatus);
            setTimeout(function() {
                illuminatedPlayer.illuminated = false;
                io.emit('player illuminated', socketID, false);
            }, 1000); //flip back color after 1 seconds
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

setInterval(serverIntermittentFunctions.printRoomsStatus, 2000, roomList);
setInterval(serverIntermittentFunctions.sendRoomStatus, 2000, roomList, io);

server.listen(server_constants.server_settings.PORT, "0.0.0.0", ()=> {
    console.log(`Server running on port ${server_constants.server_settings.PORT}`);
});


