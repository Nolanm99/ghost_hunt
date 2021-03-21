const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const socketio = require('socket.io');
const PORT = 3000;
const server = http.createServer(app);
const io = socketio(server)
const PLAYER_VELOCITY = 2;

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/js/')))
var connectionList = [];
var playerList = [];


class Connection {
    constructor(id) {
        this.socketID = id;
        this.madePlayer = false;
    }
}
class Player {
    constructor(id, color) {
        this.socketID = id
        this.color = color;
        this.Xposition = 0;
        this.Yposition = 0;
    }
}


//On client connection
io.on('connection', socket => {
    console.log('New Connection: ', socket.id);
    connectionList.push(new Connection(socket.id));
    console.log('Current Connections: ', connectionList);

    //Sync with other players (download their positions)
    socket.emit('player sync', playerList);

    //When someone hits the new player button
    socket.on('new player', (connectionID, color)=> {
        console.log('New Player Created: ', connectionID, color)
        socket.broadcast.emit('new player', connectionID, color);
        playerList.push(new Player(connectionID, color));
    });

    //When a player moves their position
    socket.on('player movement', (connectionID, direction)=> {
        selectedPlayer = playerList.find(obj=>obj.socketID==connectionID);
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
        socket.broadcast.emit('player movement', connectionID, selectedPlayer.Xposition, selectedPlayer.Yposition);
    });

    //When the client disconnects
    socket.on('disconnect', ()=> {
        socket.broadcast.emit('player disconnect', socket.id);
        console.log('DISCONNECTED: ', socket.id)
        connectionList = connectionList.filter(obj => {
            return obj.socketID != socket.id;
        });
        playerList = playerList.filter(obj => {
            return obj.socketID != socket.id;
        });
    });
    
});

server.listen(PORT, "0.0.0.0", ()=> {
    console.log('Server running on port 3000');
});