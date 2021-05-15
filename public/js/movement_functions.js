function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 87) {
        window.Wpressed = true;
    } else if (keyCode == 83) {
        window.Spressed = true;
    } else if (keyCode == 65) {
        window.Apressed = true;
    } else if (keyCode == 68) {
        window.Dpressed = true;
    } else if (keyCode == 32) {
        window.Spacepressed = true;
        window.Space_unpressed = false;
    }};

function onDocumentKeyUp(event) {
    var keyCode = event.keyCode;
    if (keyCode == 87) {
        window.W_unpressed = true;
        window.Wpressed = false;
    } else if (keyCode == 83) {
        window.S_unpressed = true;
        window.Spressed = false;
    } else if (keyCode == 65) {
        window.A_unpressed = true;
        window.Apressed = false;
    } else if (keyCode == 68) {
        window.D_unpressed = true;
        window.Dpressed = false;
    } else if (keyCode == 32) {
        window.Space_unpressed = true;
        window.Spacepressed = false;
    }};

function onMouseMove(event) {
    selfPlayer = players.find(obj=>obj.socketID==socket.id);
    if(typeof selfPlayer !== 'undefined') {
        selfFlashLight = playersFlashlights.find(obj=>obj.socketID==socket.id);
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        raycaster.setFromCamera(mouse.clone(), camera);

        mapPlane = mapAssets.find(obj=>obj.name == "Plane");

        intersects = raycaster.intersectObject(mapPlane);
    
        
        if (intersects.length > 0) {
            relativePointX = intersects[0].point.x - selfPlayer.position.x;
            relativePointY = intersects[0].point.y - selfPlayer.position.y;
            angle = Math.atan2(relativePointY, relativePointX);
        }
        player = players.find(obj=>obj.socketID==socket.id);    
        playerFlashLight = playersFlashlights.find(obj=>obj.socketID==socket.id);
        player.rotation.z = angle
        playerFlashLight.rotation.z = angle + Math.PI/2;
        playerFlashLight.position.x = selfPlayer.position.x + Math.cos(selfPlayer.rotation.z) * FLASHLIGHT_DIST_FROM_PLAYER;
        playerFlashLight.position.y = selfPlayer.position.y + Math.sin(selfPlayer.rotation.z) * FLASHLIGHT_DIST_FROM_PLAYER;
        socket.emit('player rotation', socket.id, angle)
    }
}

function checkWallIntersection(playerCollisionBox) {
    selfPlayer = players.find(obj=>obj.socketID==socket.id);
    if(typeof selfPlayer !== 'undefined') {
        var collisions = [];
        //check for collisions with each wall
        wallCollisionBoxes.forEach(wall=> {
            collisions.push(playerCollisionBox.intersectsBox(wall))
        })
        //return true if there was a collision with ANY wall
        collision = collisions.some(function(e) {
            return e == true;
        })
        return collision
    }
}

function onMouseDown(event) {
    mouseDown = true;
    mouseUp = false;
}

function onMouseUp(event) {
    mouseDown = false;
    mouseUp = true;
}