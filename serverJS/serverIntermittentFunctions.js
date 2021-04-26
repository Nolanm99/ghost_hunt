
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
    }
    
}