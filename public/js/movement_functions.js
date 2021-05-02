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
    if(typeof selfPlayer !== 'undefined') {
        selfPlayer = players.find(obj=>obj.socketID==socket.id);
        selfFlashLight = playersFlashlights.find(obj=>obj.socketID==socket.id);
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        raycaster.setFromCamera(mouse.clone(), camera);
        intersects = raycaster.intersectObject(scene.children[0]);
    
        
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

function onMouseDown(event) {
    mouseDown = true;
    mouseUp = false;
}

function onMouseUp(event) {
    mouseDown = false;
    mouseUp = true;
}