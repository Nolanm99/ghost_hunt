var mouse = new THREE.Vector2();
var playerDirection = new THREE.Vector3();
var date = new Date();
var intersects = [];
var mouseDown = false;
var mouseUp = true;
var selfPlayersCreated = 0;
var players = [];
var playersFlashlights = [];
var selfPlayersIndex = -1;
var gameStarted = 0; //0: pregame, 1: in-game,
var gameOver = false; 
var debugMode = false;

//ANIMATION LOOP
function animate() {
    if(debugMode) {roomInfo.innerText = `Socket: ${socket.id}, Room: `;}
    if(gameStarted == 0) {messageOverlay.innerText = "Waiting for Players...";}
    if(gameOver == true) {
        messageOverlay.innerText = "Game Over!";
        leaveGameBtn.style.display = "block";
    }

    requestAnimationFrame(animate);
    selfPlayer = players.find(obj=>obj.socketID==socket.id);
    selfFlashLight = playersFlashlights.find(obj=>obj.socketID==socket.id);

    if (selfPlayer && selfPlayer.movementLock == false) {
        if (window.Wpressed) {
            selfPlayer.position.y += PLAYER_VELOCITY;
            selfFlashLight.position.y += PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 1) //1 = up
        }
        if (window.Apressed) {
            selfPlayer.position.x -= PLAYER_VELOCITY;
            selfFlashLight.position.x -= PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 2) //2 = left
        }
        if (window.Spressed) {
            selfPlayer.position.y -= PLAYER_VELOCITY;
            selfFlashLight.position.y -= PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 3) //3 = down
        }
        if (window.Dpressed) {
            selfPlayer.position.x += PLAYER_VELOCITY;
            selfFlashLight.position.x += PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 4) //4 = right
        }
        if (mouseDown) {
            //send request to turn flashlight on
            socket.emit('player flashlight on', socket.id);
            
            //check for collisions
            if(selfFlashLight.visible) {
                playerDirection.set(Math.cos(selfPlayer.rotation.z), Math.sin(selfPlayer.rotation.z), 0);
                playerLightRayCaster.set(selfPlayer.position, playerDirection);
                intersects = playerLightRayCaster.intersectObjects(players);
                intersects = intersects.filter(function (obj) {
                    return obj.distance <= 50;
                })
                if (intersects.length) {
                    intersects.forEach((cube)=> {
                        cube.object.material.color.set('#fcba03')
                        cube.object.illuminatedStartTime = date.getTime();
                        cube.object.illuminated = true;
                        socket.emit('player illuminated', cube.object.socketID, true);
                    })
                }
            }
        }

        if (mouseUp) {
            if(selfFlashLight.visible == true) {
                socket.emit('player flashlight off', socket.id);
            }
        }
    }
    renderer.render(scene, camera);
}

document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("keyup", onDocumentKeyUp, false);
document.addEventListener("mousemove", onMouseMove, false);
document.addEventListener("mousedown", onMouseDown, false);
document.addEventListener("mouseup", onMouseUp, false);

newPlayerBtn.addEventListener('click', () => {
    selfCreatePlayer();
    siteMenu.style.display                 = "none";
    flashLightBatteryElement.style.display = "block";
    healthStatusCardElement.style.display  = "block";
})

//loadMap(()=>{})
LoadScene(scene, plane, ambientLight, directionalLight);
animate();
