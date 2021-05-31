socket.on('message', (message) => {
    console.log(message);
})

socket.on('game settings', (game_settings, serverRoomID) => {
    console.log(`Received game settings from server.`);
    PLAYER_VELOCITY = game_settings.PLAYER_VELOCITY;
    debugMode = game_settings.DEBUG_MODE;
    roomID = serverRoomID;
})

socket.on('new player', (connectionID, color) => {
    createOtherPlayer(connectionID, color, ()=> {
    });
});

socket.on('player sync', (serverPlayerList)=> {
    serverPlayerList.forEach( (player)=> { //for every current connection that started the game
        createOtherPlayer(player.socketID, player.color, (importedCube, importedCone)=> {
            importedCube.position.x = player.Xposition;
            importedCube.position.y = player.Yposition;
            importedCone.position.y = player.Yposition;
            importedCone.position.y = player.Yposition;
        });
    });
})

socket.on('player movement', (connectionID, Xposition, Yposition)=> {
    console.log('received player movement',connectionID, Xposition, Yposition)
    player = players.find(obj=>obj.socketID==connectionID);
    flashlight = playersFlashlights.find(obj=>obj.socketID==connectionID);
    player.position.x = Xposition;
    player.position.y = Yposition;
    flashlight.position.x = Xposition + Math.cos(player.rotation.z) * FLASHLIGHT_DIST_FROM_PLAYER;
    flashlight.position.y = Yposition + Math.sin(player.rotation.z) * FLASHLIGHT_DIST_FROM_PLAYER;
})

socket.on('player flashlight on', (socketID)=> {
    flashlight = playersFlashlights.find(obj=>obj.socketID==socketID);
    player = players.find(obj=>obj.socketID==socketID)
    if(typeof flashlight !== 'undefined') {
        if(player.isGhost == true && socket.id == player.socketID) {
            //if flashlight belongs to ghost, and the ghost is you (lol), turn it on
            flashlight.visible = true;
        }
        else if (player.isGhost == false) {
            flashlight.visible = true;
        }
    }
});
socket.on('player flashlight off', (socketID)=> {
    flashlight = playersFlashlights.find(obj=>obj.socketID==socketID);
    if(typeof flashlight !== 'undefined') {
        flashlight.visible = false;
    }
});

socket.on('battery status', (batteryLevel)=> {
    selfPlayer = players.find(obj=>obj.socketID==socket.id);
    flashLightBatteryProgressBarElement.style.width = String(batteryLevel).concat("%");
});

socket.on('health status', (healthLevel)=> {
    console.log(`received new health level ${healthLevel}`);
    selfPlayer = players.find(obj=>obj.socketID==socket.id);
    selfPlayer.healthLevel = healthLevel
    healthProgressBarElement.style.width = String(healthLevel).concat("%");
});

socket.on('player rotation', (socketID, newAngle)=> {   
    player = players.find(obj=>obj.socketID==socketID);
    flashlight = playersFlashlights.find(obj=>obj.socketID==socketID);

    if(typeof player !== 'undefined') {
        player.rotation.z = newAngle
        flashlight.rotation.z = newAngle + Math.PI/2;
        flashlight.position.x = player.position.x + Math.cos(player.rotation.z) * FLASHLIGHT_DIST_FROM_PLAYER;
        flashlight.position.y = player.position.y + Math.sin(player.rotation.z) * FLASHLIGHT_DIST_FROM_PLAYER;
    }
});

socket.on('player illuminated', (socketID, illuminatedStatus)=> {
    console.log(`received player illuminated`)
    illuminatedPlayer = players.find(obj=>obj.socketID==socketID);
    illuminatedPlayer.illuminated = illuminatedStatus;
    if(illuminatedPlayer.illuminated) {
        if(illuminatedPlayer.isGhost && socket.id !== illuminatedPlayer.socketID) {
            illuminatedPlayer.material.visible = true;
            setTimeout(function() {illuminatedPlayer.material.visible = false},2000);
        }
        illuminatedPlayer.material.color.set('#fcba03');
    }
    else {
        newColor = '#'.concat(illuminatedPlayer.originalColor)
        illuminatedPlayer.material.color.set(newColor);
    }
});

socket.on('game started', roomStatus => {
    console.log('Game Started!');
    gameStarted = 1;
    
    // Lock all players movement for 5 seconds
    players.forEach(player => {
        player.movementLock = true;
    })
    messageOverlay.innerText = "Starting in 5 seconds!";
    setTimeout(function() {
        players.forEach(player => {
            player.movementLock = false;
            messageOverlay.innerText = "";
        })
    }, 5000);
})

socket.on('room status', room => {
    gameStarted = room.roomStatus;
})

socket.on('selected ghost', socketID => {
    console.log(`Ghost selected! ${socketID}`);
    ghost = players.find(obj=>obj.socketID==socketID);
    ghost.isGhost = true;

    //Hide ghost (only if you aren't the ghost)
    if(socket.id !== ghost.socketID) { //If you aren't the ghost
        setTimeout(function() {
            ghost.material.visible = false;
        }, 5000)
    }
})

socket.on('game over', () => {
    gameOver = true;
    gameStarted = false;
}) 

socket.on('player disconnect', connectionID => {
    removePlayerFromGame(connectionID);
})