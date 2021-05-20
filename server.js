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


//Import classes
var serverClasses = require('./serverJS/classes.js');




roomList.push(new serverClasses.Room(1));

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
            newRoomID = roomList.length + 1;
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
        console.log(`socket: ${socketID}`)
        illuminatedPlayer = playerList.find(obj=>obj.socketID==socketID);
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


            io.emit('player illuminated', socketID, illuminatedStatus);
            setTimeout(function() {
                illuminatedPlayer.illuminated = false;
                io.emit('player illuminated', socketID, false);
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

setInterval(serverIntermittentFunctions.printRoomsStatus, 2000, roomList);
setInterval(serverIntermittentFunctions.sendRoomStatus, 2000, roomList, io);
setInterval(serverIntermittentFunctions.addAiAgentIfNeeded, 500, roomList, playerList, io);
setInterval(serverIntermittentFunctions.startGameIfNeeded, 500, roomList, io);

server.listen(server_constants.server_settings.PORT, "0.0.0.0", ()=> {
    console.log(`Server running on port ${server_constants.server_settings.PORT}`);
});


