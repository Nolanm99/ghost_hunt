const socket = io();
const newPlayerBtn = document.getElementById('newPlayerBtn');
const PLAYER_CREATION_LIMIT = 1;
const SPHERE_RADIUS = 10;
const PLAYER_VELOCITY = 2;
var selfPlayersCreated = 0;
var players = [];
var selfPlayersIndex = -1;

socket.on('message', (message) => {
    console.log(message);
})

socket.on('new player', (connectionID, color) => {
    createOtherPlayer(connectionID, color);
});

socket.on('player sync', (connections)=> {
    console.log('CURRENT CONNECTIONS: ', connections);
    
    players = connections.filter(obj => {
        return obj.madePlayer == true;
    });


    console.log(players)
    players.forEach( (player)=> {
        createOtherPlayer(player.id, player.playerColor);

        selectedPlayer = players.filter(obj => {
            return obj.name == player.id;
        });
        selectedPlayer[0].position.x = player.Xposition;
        selectedPlayer[0].position.y = player.Yposition;
    });
    
    

    
    
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

socket.on('player movement', (connectionID, Xposition, Yposition)=> {
    player = players.filter(obj => {
        return obj.name == connectionID;
    })
    
    player[0].position.x = Xposition;
    player[0].position.y = Yposition;
    
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
        geometry = new THREE.SphereGeometry(SPHERE_RADIUS,10,10);
        color = '#'.concat(Math.floor(Math.random()*16777215).toString(16)); // create material with random color
        material = new THREE.MeshStandardMaterial( {'color': color} ); 
        sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(0,0,SPHERE_RADIUS);
        sphere.castShadow = true;
        sphere.name = socket.id;
        players.push(sphere);
        selfPlayersIndex = players.length - 1
        scene.add(players[players.length - 1])
        socket.emit('new player', sphere.name, color  );
        selfPlayersCreated += 1;
    }
    else {
        console.log('You have already created a player!')
    }
}

function createOtherPlayer(connectionID, color) {
    geometry = new THREE.SphereGeometry(SPHERE_RADIUS,10,10);
    material = new THREE.MeshStandardMaterial( {'color': color} );
    sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0,0,SPHERE_RADIUS);
    sphere.castShadow = true;
    sphere.name = connectionID;
    players.push(sphere);
    scene.add(players[players.length - 1])
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
directionalLight.position.set(0,0,250);
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
        return obj.name == socket.id;
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



