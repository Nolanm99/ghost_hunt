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
var connections = [];

class Connection {
    constructor(id) {
        this.id = id;
        this.madePlayer = false;
        this.playerColor = '';
        this.Xposition = -1;
        this.Yposition = -1;
    }
}


//On client connection
io.on('connection', socket => {
    console.log('New Connection: ', socket.id);
    connection = new Connection(socket.id);
    connections.push(connection);
    console.log(Object.keys(io.engine.clients));

    //Sync with other players (download their positions)
    socket.emit('player sync', connections)

    //When someone hits the new player button
    socket.on('new player', (connectionID, color)=> {
        console.log(connectionID, color)
        socket.broadcast.emit('new player', connectionID, color);
        connectionFilter = connections.filter(obj => {
            return obj.id == connectionID;
        });
        connectionFilter[0].madePlayer = true;
        connectionFilter[0].playerColor = color;
        connectionFilter[0].Xposition = 0
        connectionFilter[0].Yposition = 0;
    });

    //When a player moves their position
    socket.on('player movement', (connectionID, direction)=> {
        connection = connections.find(obj=>obj.id==connectionID);
        if(direction == 1) {
            connection.Yposition += PLAYER_VELOCITY;
        }
        else if(direction == 2) {
            connection.Xposition -= PLAYER_VELOCITY;
        }
        else if(direction == 3) {
            connection.Yposition -= PLAYER_VELOCITY;
        }
        else if(direction == 4) {
            connection.Xposition += PLAYER_VELOCITY;
        }
        socket.broadcast.emit('player movement', connectionID, connection.Xposition, connection.Yposition);
    });

    //When the client disconnects
    socket.on('disconnect', ()=> {
        socket.broadcast.emit('player disconnect', socket.id);
        console.log('DISCONNECTED: ', socket.id)
        connections = connections.filter(obj => {
            return obj.id != socket.id;
        });
    });
    
});

server.listen(PORT, "0.0.0.0", ()=> {
    console.log('Server running on port 3000');
});