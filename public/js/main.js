var mouse = new THREE.Vector2();
var playerDirection = new THREE.Vector3();
var wallCollisionRayDirections = [];
var date = new Date();
var intersects = [];
var mouseDown = false;
var mouseUp = true;
var selfPlayersCreated = 0;
var players = [];
var aiPlayers = [];
var playerCollisionSpheres = [];
var playersFlashlights = [];
var selfPlayersIndex = -1;
var gameStarted = false; 
var gameOver = false; 
var debugMode = false;
var checkWall = false;


//ANIMATION LOOP
function animate() {
    if(debugMode) {roomInfo.innerText = `Socket: ${socket.id}, Room: ${roomID}`;}
    if(gameStarted == false) {messageOverlay.innerText = "Waiting for Players...";}
    if(gameOver == true) {
        messageOverlay.innerText = "Game Over!";
        leaveGameBtn.style.display = "block";
    }

    selfPlayer = players.find(obj=>obj.socketID==socket.id);
    selfFlashLight = playersFlashlights.find(obj=>obj.socketID==socket.id);


    
    if (selfPlayer && selfPlayer.movementLock == false) {

        if(gameStarted && selfPlayer.isGhost) {messageOverlay.innerText = "You are the ghost!";}
        selfCollisionSphere = playerCollisionSpheres.find(obj=>obj.socketID==socket.id);
        selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)

        //If player is not ghost, get distance to nearest ghost
        if(!selfPlayer.isGhost && gameStarted) {
            selectedGhost = players.find(obj=>obj.isGhost==true);
            distanceFromPlayer = Math.sqrt( Math.pow(selectedGhost.position.x - selfPlayer.position.x,2) + Math.pow(selectedGhost.position.y - selfPlayer.position.y,2) );
            if(debugMode) {distanceToGhostOverlay.innerText = Math.round(distanceFromPlayer).toString()};
        }


        //Update the ai agents according to their states        
        aiPlayers = players.filter(obj=> {return obj.socketID.search("ai_") != -1;});
        if(aiPlayers.length > 0) {
            aiPlayers.forEach(aiPlayer => {
                aiCollisionSphere = playerCollisionSpheres.find(obj=>obj.socketID==aiPlayer.socketID);
                collisionPreCheck = checkWallIntersection(aiCollisionSphere);
                if(!collisionPreCheck) {
                    aiPlayer.position.x += aiPlayer.xMovement*PLAYER_VELOCITY;
                    collisionPostCheck = checkWallIntersection(aiCollisionSphere);
                    if(collisionPostCheck) {
                        aiPlayer.position.x -= aiPlayer.xMovement*PLAYER_VELOCITY;
                    }

                    aiPlayer.position.y += aiPlayer.yMovement*PLAYER_VELOCITY;
                    collisionPostCheck = checkWallIntersection(aiCollisionSphere);
                    if(collisionPostCheck) {
                        aiPlayer.position.y -= aiPlayer.xMovement*PLAYER_VELOCITY;
                    }

                    socket.emit('ai position update', aiPlayer.socketID, aiPlayer.position); 
                }
            })
        }


        if (window.Wpressed) {
            collisionPreCheck = checkWallIntersection(selfCollisionSphere)
            if(!collisionPreCheck) {
                selfPlayer.position.y += PLAYER_VELOCITY;
                selfFlashLight.position.y += PLAYER_VELOCITY;
                selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                socket.emit('player movement', socket.id, 1) //1 = up

                camera.position.y += PLAYER_VELOCITY/2;

                //If hit a wall after this move, move back.
                collisionPostCheck = checkWallIntersection(selfCollisionSphere)
                if(collisionPostCheck) {
                    selfPlayer.position.y -= PLAYER_VELOCITY;
                    selfFlashLight.position.y -= PLAYER_VELOCITY;
                    selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                    socket.emit('player movement', socket.id, 3) //3 = down

                    camera.position.y -= PLAYER_VELOCITY/2;
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

                camera.position.x -= PLAYER_VELOCITY/2;

                //If hit a wall after this move, move back.
                collisionPostCheck = checkWallIntersection(selfCollisionSphere)
                if(collisionPostCheck) {
                    selfPlayer.position.x += PLAYER_VELOCITY;
                    selfFlashLight.position.x += PLAYER_VELOCITY;
                    selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                    socket.emit('player movement', socket.id, 4) //4 = right

                    camera.position.x += PLAYER_VELOCITY/2;
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

                camera.position.y -= PLAYER_VELOCITY/2;

                //If hit a wall after this move, move back.
                collisionPostCheck = checkWallIntersection(selfCollisionSphere)
                if(collisionPostCheck) {
                    selfPlayer.position.y += PLAYER_VELOCITY;
                    selfFlashLight.position.y += PLAYER_VELOCITY;
                    selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                    socket.emit('player movement', socket.id, 1) //1 = up

                    camera.position.y += PLAYER_VELOCITY/2;
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

                camera.position.x += PLAYER_VELOCITY/2;

                //If hit a wall after this move, move back.
                collisionPostCheck = checkWallIntersection(selfCollisionSphere)
                if(collisionPostCheck) {
                    selfPlayer.position.x -= PLAYER_VELOCITY;
                    selfFlashLight.position.x -= PLAYER_VELOCITY;
                    selfCollisionSphere.center.set(selfPlayer.position.x,selfPlayer.position.y,selfPlayer.position.z)
                    socket.emit('player movement', socket.id, 2) //2 = left

                    camera.position.x -= PLAYER_VELOCITY/2;
                }
            }
        }

        if (mouseDown) {
            //Ghosts don't have flashlights!
            if(!selfPlayer.isGhost) {
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
                            if(cube.object.isGhost) {
                                //send illuminate message only if the player is a ghost
                                socket.emit('player illuminated', roomID, cube.object.socketID, true);
                                cube.object.material.color.set('#fcba03')
                                cube.object.illuminatedStartTime = date.getTime();
                                cube.object.illuminated = true;
                            }
                        })
                    }
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
