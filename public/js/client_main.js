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

socket.on('message', (message) => {
    console.log(message);
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
    player = players.find(obj=>obj.socketID==connectionID);
    flashlight = playersFlashlights.find(obj=>obj.socketID==connectionID);

    player.position.x = Xposition;
    player.position.y = Yposition;
    flashlight.position.x = Xposition + Math.cos(player.rotation.z) * 37.5;
    flashlight.position.y = Yposition + Math.sin(player.rotation.z) * 37.5;
})

socket.on('player flashlight on', (socketID)=> {
    flashlight = playersFlashlights.find(obj=>obj.socketID==socketID);
    if(typeof flashlight !== 'undefined') {
        flashlight.visible = true;
    }
});
socket.on('player flashlight off', (socketID)=> {
    console.log('received flashlight off status');
    flashlight = playersFlashlights.find(obj=>obj.socketID==socketID);
    if(typeof flashlight !== 'undefined') {
        flashlight.visible = false;
    }
});

socket.on('battery status', (batteryLevel)=> {
    selfPlayer = players.find(obj=>obj.socketID==socket.id);
    flashLightBatteryProgressBarElement.style.width = String(batteryLevel).concat("%");
});

socket.on('player rotation', (socketID, newAngle)=> {   
    player = players.find(obj=>obj.socketID==socketID);
    flashlight = playersFlashlights.find(obj=>obj.socketID==socketID);

    if(typeof player !== 'undefined') {
        player.rotation.z = newAngle
        flashlight.rotation.z = newAngle + Math.PI/2;
        flashlight.position.x = player.position.x + Math.cos(player.rotation.z) * 37.5;
        flashlight.position.y = player.position.y + Math.sin(player.rotation.z) * 37.5;
    }
});

socket.on('player illuminated', (socketID, illuminatedStatus)=> {
    player = players.find(obj=>obj.socketID==socketID);
    player.illuminated = illuminatedStatus;
    if(player.illuminated) {
        player.material.color.set('#fcba03')
    }
    else {
        newColor = '#'.concat(player.originalColor)
        player.material.color.set(newColor);
    }
});

socket.on('player disconnect', connectionID => {
    disconnectedPlayer = players.filter(obj => {
        return obj.socketID == connectionID;
    });
    players = players.filter(obj => {
        return obj.socketID != connectionID;
    });
    console.log('DISCONNECTED: ', connectionID);
    scene.remove(disconnectedPlayer[0]);
})



function selfCreatePlayer() {
    if(selfPlayersCreated < PLAYER_CREATION_LIMIT) {
        color = '#'.concat(Math.floor(Math.random()*16777215).toString(16)); // create material with random color
        loader.load('/public/assets/box.glb', function (gltf) {
            modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
            gltf.scene.traverse((o) => {
                if (o.name == 'Cube') importedCube = o;
                if (o.name == 'Cone') importedCone = o;
            });
            importedCube.position.z = 12.5;
            importedCube.material = modelMaterial;
            importedCone.position.z = 12.5;
            importedCube.castShadow = true;
            importedCube.originalColor = importedCube.material.color.getHexString();
            importedCube.socketID = socket.id;
            importedCube.flashlightBattery = 100;
            importedCone.socketID = socket.id;
            importedCone.visible = false;
            players.push(importedCube);
            playersFlashlights.push(importedCone);
            scene.add(importedCube);
            scene.add(importedCone);
            importedCube.rotation.z = 0
            socket.emit('new player', importedCube.socketID, color);
            selfPlayersCreated += 1;
        })
    }
    else {
        console.log('You have already created a player!')
    }
}

function createOtherPlayer(connectionID, color, callback) {
    loader.load('/public/assets/box.glb', function (gltf) {
        modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
        gltf.scene.traverse((o) => {
            if (o.name == 'Cube') importedCube = o;
            if (o.name == 'Cone') importedCone = o;
        });
        importedCube.position.z = 12.5;
        importedCube.material = modelMaterial;
        importedCone.position.z = 12.5;
        importedCube.castShadow = true;
        importedCube.originalColor = importedCube.material.color.getHexString();
        importedCube.socketID = connectionID;
        importedCube.flashlightBattery = 100;
        importedCone.socketID = connectionID;
        importedCone.visible = false;
        players.push(importedCube);
        playersFlashlights.push(importedCone);
        scene.add(importedCube);
        scene.add(importedCone);
        callback(importedCube, importedCone);
    });
}

//ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);
    selfPlayer = players.find(obj=>obj.socketID==socket.id);
    selfFlashLight = playersFlashlights.find(obj=>obj.socketID==socket.id);
    if (selfPlayersCreated > 0) {
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
                        socket.emit('player illuminated', cube.object.socketID, cube.object.illuminated);
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
    siteMenu.style.display = "none";
    flashLightBatteryElement.style.display = "block";
})


animate();
