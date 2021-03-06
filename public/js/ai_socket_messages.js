socket.on('new ai player', (connectionID) => {
    createAIPlayer(connectionID, () => {});
});


socket.on('new ai state', (connectionID, newState) => {
    //find the player, set the movement booleans and rotation angle
    console.log('new ai state')
    player = players.find(obj=>obj.socketID==connectionID);
    player.xMovement = newState.xMovement;
    player.yMovement = newState.yMovement;
    player.rotation.z = newState.rotationAngle;
});
