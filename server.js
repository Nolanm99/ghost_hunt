const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const socketio = require('socket.io');
const PORT = 3000;
const server = http.createServer(app);
const io = socketio(server)
const PLAYER_VELOCITY = 2;
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const passportSetup = require('./config/passport-setup');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const keys = require('./config/keys')

app.use('/public/', express.static(path.join(__dirname, 'public')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/js/')))
app.use('/three/', express.static(path.join(__dirname, 'node_modules/three/build/')))

//Set static folder
app.set('view engine', 'ejs')

app.use(cookieSession({
    maxAge:24*60*60*1000,
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




//Load dependencies
var serverIntermittentFunctions = require('./serverJS/serverIntermittentFunctions.js');
var connectionList = [];
var playerList = [];
var roomList = [];

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
        this.flashlightLockoutTimer = false;
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

        //Find a room to put the player in
        roomList.forEach(room => {
            if(room.playerList.length < room.MAX_PLAYERS && newPlayer.roomID == 0) {
                //Send the room's player list for synchronization
                socket.emit('player sync', room.playerList);   
                
                room.playerList.push(newPlayer);
                newPlayer.roomID = room.roomID;
                socket.join(room.roomID)
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

        console.log('New Player Created: ', connectionID, color)
        socket.to(newPlayer.roomID).emit('new player', connectionID, color);
    });

   

    //When a player moves their position
    socket.on('player movement', (connectionID, direction)=> {
        selectedPlayer = playerList.find(obj=>obj.socketID==connectionID);
        selectedRoom = roomList.find(room => room.roomID == selectedPlayer.roomID);

        if(direction == 1) {
            selectedPlayer.Yposition += PLAYER_VELOCITY;
        }
        else if(direction == 2) {
            selectedPlayer.Xposition -= PLAYER_VELOCITY;
        }
        else if(direction == 3) {
            selectedPlayer.Yposition -= PLAYER_VELOCITY;
        }
        else if(direction == 4) {
            selectedPlayer.Xposition += PLAYER_VELOCITY;
        }

        if (Math.abs(selectedPlayer.Xposition) > 250 || Math.abs(selectedPlayer.Yposition) > 250) {
            if (selectedPlayer.Xposition > 250) selectedPlayer.Xposition = 250;
            else if (selectedPlayer.Xposition < -250) selectedPlayer.Xposition = -250;
            else if (selectedPlayer.Yposition > 250) selectedPlayer.Yposition = 250;
            else if (selectedPlayer.Yposition < -250) selectedPlayer.Yposition = -250;

            io.to(selectedRoom.roomID).emit('player movement', connectionID, selectedPlayer.Xposition, selectedPlayer.Yposition);
        }

        //Send player movement data to players in the same room
        io.to(selectedRoom.roomID).emit('player movement', connectionID, selectedPlayer.Xposition, selectedPlayer.Yposition);

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
        selectedPlayer = playerList.find(obj=>obj.socketID==socketID);
        selectedPlayer.illuminated = illuminatedStatus;
        io.emit('player illuminated', socketID, illuminatedStatus);
        setTimeout(function() {
            selectedPlayer.illuminated = !illuminatedStatus;
            io.emit('player illuminated', socketID, !illuminatedStatus);
        }, 1000); //flip back color after 1 seconds
    });

    //When the client disconnects
    socket.on('disconnect', ()=> {
        selectedPlayer = playerList.find(obj=>obj.socketID==socket.id);
        if(selectedPlayer) {
            selectedRoom = roomList.find(room => room.roomID == selectedPlayer.roomID);
        }
        
        //socket.broadcast.emit('player disconnect', socket.id);
        io.to(selectedRoom.roomID).emit('player disconnect', socket.id);

        console.log('DISCONNECTED: ', socket.id)
        connectionList = connectionList.filter(obj => {
            return obj.socketID != socket.id;
        });
        playerList = playerList.filter(obj => {
            return obj.socketID != socket.id;
        });

        selectedRoom.playerList = selectedRoom.playerList.filter(obj => {
            return obj.socketID != socket.id;
        });
    });
    setInterval(serverIntermittentFunctions.chargeBatteriesWhileFlashlightOff, 100, playerList);
    setInterval(serverIntermittentFunctions.updateBatteryStatus, 100, playerList, io);
});

setInterval(serverIntermittentFunctions.printRoomsStatus, 2000, roomList);

server.listen(PORT, "0.0.0.0", ()=> {
    console.log('Server running on port 3000');
});


