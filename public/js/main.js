var mouse = new THREE.Vector2();
var playerDirection = new THREE.Vector3();
var wallCollisionRayDirections = [];
var date = new Date();
var intersects = [];
var mouseDown = false;
var mouseUp = true;
var selfPlayersCreated = 0;
var players = [];
var playerCollisionSpheres = [];
var playersFlashlights = [];
var selfPlayersIndex = -1;
var gameStarted = 0; //0: pregame, 1: in-game,
var gameOver = false; 
var debugMode = false;
var checkWall = false;


//ANIMATION LOOP
function animate() {
    if(debugMode) {roomInfo.innerText = `Socket: ${socket.id}, Room: `;}
    if(gameStarted == 0) {messageOverlay.innerText = "Waiting for Players...";}
    if(gameOver == true) {
        messageOverlay.innerText = "Game Over!";
        leaveGameBtn.style.display = "block";
    }

    selfPlayer = players.find(obj=>obj.socketID==socket.id);
    selfFlashLight = playersFlashlights.find(obj=>obj.socketID==socket.id);
    
    if (selfPlayer && selfPlayer.movementLock == false) {

        selfCollisionSphere = playerCollisionSpheres.find(obj=>obj.socketID==socket.id);
        selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)

        if (window.Wpressed) {
            collisionPreCheck = checkWallIntersection(selfCollisionSphere)
            if(!collisionPreCheck) {
                selfPlayer.position.y += PLAYER_VELOCITY;
                selfFlashLight.position.y += PLAYER_VELOCITY;
                selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                socket.emit('player movement', socket.id, 1) //1 = up

                //If hit a wall after this move, move back.
                collisionPostCheck = checkWallIntersection(selfCollisionSphere)
                if(collisionPostCheck) {
                    selfPlayer.position.y -= PLAYER_VELOCITY;
                    selfFlashLight.position.y -= PLAYER_VELOCITY;
                    selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                    socket.emit('player movement', socket.id, 3) //3 = down
                }
            }
        }
        if (window.Apressed) {
            collisionPreCheck = checkWallIntersection(selfCollisionSphere)
            if(!collisionPreCheck) {
                selfPlayer.position.x -= PLAYER_VELOCITY;
                selfFlashLight.position.x -= PLAYER_VELOCITY;
                selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                socket.emit('player movement', socket.id, 2) //2 = left

                //If hit a wall after this move, move back.
                collisionPostCheck = checkWallIntersection(selfCollisionSphere)
                if(collisionPostCheck) {
                    selfPlayer.position.x += PLAYER_VELOCITY;
                    selfFlashLight.position.x += PLAYER_VELOCITY;
                    selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                    socket.emit('player movement', socket.id, 4) //4 = right
                }
            }
        }
        if (window.Spressed) {
            collisionPreCheck = checkWallIntersection(selfCollisionSphere)
            if(!collisionPreCheck) {
                selfPlayer.position.y -= PLAYER_VELOCITY;
                selfFlashLight.position.y -= PLAYER_VELOCITY;
                selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                socket.emit('player movement', socket.id, 3) //3 = down

                //If hit a wall after this move, move back.
                collisionPostCheck = checkWallIntersection(selfCollisionSphere)
                if(collisionPostCheck) {
                    selfPlayer.position.y += PLAYER_VELOCITY;
                    selfFlashLight.position.y += PLAYER_VELOCITY;
                    selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                    socket.emit('player movement', socket.id, 1) //1 = up
                }
            }
        }
        if (window.Dpressed) {
            collisionPreCheck = checkWallIntersection(selfCollisionSphere)
            if(!collisionPreCheck) {
                selfPlayer.position.x += PLAYER_VELOCITY;
                selfFlashLight.position.x += PLAYER_VELOCITY;
                selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                socket.emit('player movement', socket.id, 4) //4 = right

                //If hit a wall after this move, move back.
                collisionPostCheck = checkWallIntersection(selfCollisionSphere)
                if(collisionPostCheck) {
                    selfPlayer.position.x -= PLAYER_VELOCITY;
                    selfFlashLight.position.x -= PLAYER_VELOCITY;
                    selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                    socket.emit('player movement', socket.id, 2) //2 = left
                }
            }
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
                    return obj.distance <= FLASHLIGHT_LENGTH;
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
    //scene.simulate()
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
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

loadMap(()=>{})
LoadScene(scene, plane, ambientLight, directionalLight);
animate();
