const socket = io();
const newPlayerBtn = document.getElementById('newPlayerBtn');
const PLAYER_CREATION_LIMIT = 1;
const SPHERE_RADIUS = 10;
const PLAYER_VELOCITY = 2;
const loader = new THREE.GLTFLoader();
var selfPlayersCreated = 0;
var players = [];
var selfPlayersIndex = -1;

socket.on('message', (message) => {
    console.log(message);
})

socket.on('new player', (connectionID, color) => {
    createOtherPlayer(connectionID, color);
});

socket.on('player sync', (serverPlayerList)=> {
    console.log('Server Player List: ', serverPlayerList);

    serverPlayerList.forEach( (player)=> { //for every current connection that started the game
        console.log('CURRENT LIST OF PLAYERS (LOCAL): ', players);
        createOtherPlayer(player.socketID, player.color); //create a local player for them based on the id and color
        console.log('NEW LIST OF PLAYERS (LOCAL): ', players);
        selectedPlayer = players.filter(obj => {
            return obj.socketID == player.socketID;
        });
        console.log('Filtered List: ', selectedPlayer);
        selectedPlayer[0].position.x = player.Xposition;
        selectedPlayer[0].position.y = player.Yposition;
    });
})

socket.on('player movement', (connectionID, Xposition, Yposition)=> {
    player = players.filter(obj => {
        return obj.socketID == connectionID;
    })
    
    player[0].position.x = Xposition;
    player[0].position.y = Yposition;
    
})


socket.on('player disconnect', connectionID => {
    disconnectedPlayer = players.filter(obj => {
        return obj.name == connectionID;
    });
    players = players.filter(obj => {
        return obj.name != connectionID;
    });
    console.log('DISCONNECTED: ', connectionID);
    scene.remove(disconnectedPlayer[0]);
})


//SCENE AND RENDERER SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color('grey');
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer( {canvas: sceneCanvas} );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function selfCreatePlayer() {
    if(selfPlayersCreated < PLAYER_CREATION_LIMIT) {
        color = '#'.concat(Math.floor(Math.random()*16777215).toString(16)); // create material with random color
        loader.load('assets/box_joined.glb', function (gltf) {
            modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
            gltf.scene.traverse((o) => {
                if (o.name == 'Cube') importedModelMesh = o;
            });
            gltf.scene.position.z = 12.5;
            //gltf.scene.castShadow = true;
            gltf.scene.socketID = socket.id;
            players.push(gltf.scene);
            scene.add(gltf.scene);
            socket.emit('new player', gltf.scene.socketID, color);
            selfPlayersCreated += 1;
        },
        function(error) {
            console.log('Error loading in model.')
        });
    }
    else {
        console.log('You have already created a player!')
    }
}

function createOtherPlayer(connectionID, color) {
    loader.load('assets/box_joined.glb', function (gltf) {
        modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
        gltf.scene.traverse((o) => {
            if (o.name == 'Cube') importedModelMesh = o;
        });
        //importedModelMesh.position.z = 12.5;
        //simportedModelMesh.castShadow = true;
        gltf.scene.socketID = connectionID;
        players.push(gltf.scene);
        scene.add(gltf.scene);
    });
}

//PLANE
texture = new THREE.TextureLoader().load('../assets/checker.png');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set( 4, 4 );
const planeGeom = new THREE.PlaneGeometry(500,500,1);
const planeMaterial = new THREE.MeshStandardMaterial( {map: texture} );
const plane = new THREE.Mesh(planeGeom, planeMaterial);
plane.receiveShadow = true;
scene.add(plane);


//CONTROLS
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.noZoom = false;
controls.noPan = false;
controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;


//LIGHTING
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
scene.add(ambientLight);
const directionalLight = new THREE.SpotLight(0xFFFFFF,0.7);
directionalLight.position.set(200,0,300);
directionalLight.castShadow = true;
scene.add(directionalLight);

//CAMERA
camera.position.z = 300;
const helper = new THREE.CameraHelper( directionalLight.shadow.camera );
scene.add( helper );


//ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);
    selfPlayer = players.filter(obj => {
        return obj.socketID == socket.id;
    });
    if (selfPlayersCreated > 0) {
        if (window.Wpressed) {
            selfPlayer[0].position.y += PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 1) //1 = up
        }
        if (window.Apressed) {
            selfPlayer[0].position.x -= PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 2) //2 = left
        }
        if (window.Spressed) {
            selfPlayer[0].position.y -= PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 3) //3 = down
        }
        if (window.Dpressed) {
            selfPlayer[0].position.x += PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 4) //4 = right
        }
    }


    
    renderer.render(scene, camera);
    controls.update();
}

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
    }
};

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
    }
};

document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("keyup", onDocumentKeyUp, false);

newPlayerBtn.addEventListener('click', () => {
    selfCreatePlayer();
    newPlayerBtn.style.display = "none";
})


animate();



