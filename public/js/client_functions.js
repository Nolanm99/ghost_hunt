function selfCreatePlayer() {
    if(selfPlayersCreated < PLAYER_CREATION_LIMIT) {
        color = '#'.concat(Math.floor(Math.random()*16777215).toString(16)); // create material with random color
        loader.load('/public/assets/box_v1.1_scaling.glb', function (gltf) {
            modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
            gltf.scene.traverse((o) => {
                console.log(o)
                if (o.name == 'Cube') importedCube = o;
                if (o.name == 'Cone') importedCone = o;
            });
            importedCube.isGhost = false;
            importedCube.movementLock = 0;
            importedCube.position.z = 12.5;
            importedCube.material = modelMaterial;
            importedCone.position.z = 12.5;
            importedCube.castShadow = true;
            importedCube.originalColor = importedCube.material.color.getHexString();
            importedCube.socketID = socket.id;
            importedCube.flashlightBattery = 100;
            importedCube.healthLevel = 100;
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
    loader.load('/public/assets/box_v1.1_scaling.glb', function (gltf) {
        modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
        gltf.scene.traverse((o) => {
            if (o.name == 'Cube') importedCube = o;
            if (o.name == 'Cone') importedCone = o;
        });
        importedCube.isGhost = false;
        importedCube.movementLock = false;
        importedCube.position.z = 12.5;
        importedCube.material = modelMaterial;
        importedCone.position.z = 12.5;
        importedCube.castShadow = true;
        importedCube.originalColor = importedCube.material.color.getHexString();
        importedCube.socketID = connectionID;
        importedCube.flashlightBattery = 100;
        importedCube.healthLevel = 100;
        importedCone.socketID = connectionID;
        importedCone.visible = false;
        players.push(importedCube);
        playersFlashlights.push(importedCone);
        scene.add(importedCube);
        scene.add(importedCone);
        callback(importedCube, importedCone);
    });
    console.log('New player joined! ', connectionID);
}

function LoadScene(scene,plane,ambientLight,directionalLight,) {
    scene.add(plane);
    scene.add(ambientLight);
    scene.add(directionalLight);

}

function removePlayerFromGame(connectionIDToRemove) {
    disconnectedPlayer = players.find(obj => obj.socketID == connectionIDToRemove);
    players = players.filter(obj => {
        return obj.socketID != connectionIDToRemove;
    });
    console.log(`DISCONNECTED: ${connectionIDToRemove}`);
    scene.remove(disconnectedPlayer);
}