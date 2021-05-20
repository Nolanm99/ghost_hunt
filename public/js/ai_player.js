function AiAgentAction(aiAgentID) {
    //This function is called on every ai agent in each room, for each frame. 
    
    //select the ai agent
    selectedAiAgent = aiPlayers.find(obj=>obj.socketID == aiAgentID);

    // randomly move around

    // randomly put flashlight on for certain periods of time


    return
}

function createAIPlayer(newAIPlayerID,callback) {
    color = '#'.concat(Math.floor(Math.random()*16777215).toString(16));
    loader.load(PLAYER_MODEL_FILE, function (gltf) {
        modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
        gltf.scene.traverse((o) => {
            if (o.name == 'Cube') importedCube = o;
            if (o.name == 'Cone') importedCone = o;
        });

        importedCube.isGhost = false;
        importedCube.movementLock = false;
        importedCube.position.z = PLAYER_HEIGHT;
        importedCube.material = modelMaterial;
        importedCube.castShadow = true;
        importedCube.originalColor = importedCube.material.color.getHexString();
        importedCube.socketID = newAIPlayerID;
        importedCube.flashlightBattery = 100;
        importedCube.healthLevel = 100;

        importedCone.position.z = PLAYER_HEIGHT;
        importedCone.socketID = newAIPlayerID;
        importedCone.visible = false;

        players.push(importedCube);
        playersFlashlights.push(importedCone);
        scene.add(importedCube);
        scene.add(importedCone);

        console.log('New player joined! ', newAIPlayerID );

        callback(importedCube, importedCone);
    });
}

function createAIPlayerID() {
    numAIPlayers = 0;
    if(aiPlayers.length > 0) {
        numAIPlayers = aiPlayers.length;
    }
    newAIPlayerID = "ai_" + String(numAIPlayers + 1);
    return newAIPlayerID;
}