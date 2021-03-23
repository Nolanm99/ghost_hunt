const socket = io();
const newPlayerBtn = document.getElementById('newPlayerBtn');
const PLAYER_CREATION_LIMIT = 1;
const SPHERE_RADIUS = 10;
const PLAYER_VELOCITY = 2;
const loader = new THREE.GLTFLoader();
var mouse = new THREE.Vector2();
var mouseAngle = 0; 
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
    player = players.filter(obj => {
        return obj.socketID == connectionID;
    })
    flashlight = playersFlashlights.filter(obj => {
        return obj.socketID == connectionID;
    })
    player[0].position.x = Xposition;
    player[0].position.y = Yposition;
    flashlight[0].position.x = Xposition + 37.5;
    flashlight[0].position.y = Yposition;
})

socket.on('player flashlight toggle', (socketID, status)=> {
    selfFlashLight = playersFlashlights.filter(obj => { 
        return obj.socketID == socketID;
    });
    selfFlashLight[0].visible = status;
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
        loader.load('assets/box.glb', function (gltf) {
            modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
            gltf.scene.traverse((o) => {
                if (o.name == 'Cube') importedCube = o;
                if (o.name == 'Cone') importedCone = o;
            });
            importedCube.position.z = 12.5;
            importedCone.position.z = 12.5;
            importedCube.castShadow = true;
            importedCube.socketID = socket.id;
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
    loader.load('assets/box.glb', function (gltf) {
        modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
        gltf.scene.traverse((o) => {
            if (o.name == 'Cube') importedCube = o;
            if (o.name == 'Cone') importedCone = o;
        });
        importedCube.position.z = 12.5;
        importedCone.position.z = 12.5;
        importedCube.castShadow = true;
        importedCube.socketID = connectionID;
        importedCone.socketID = connectionID;
        importedCone.visible = false;
        players.push(importedCube);
        playersFlashlights.push(importedCone);
        scene.add(importedCube);
        scene.add(importedCone);
        callback(importedCube, importedCone);
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


//CONTROLS (disabling for now)
/*
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.noZoom = false;
controls.noPan = false;
controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;
*/

//LIGHTING
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
scene.add(ambientLight);
const directionalLight = new THREE.SpotLight(0xFFFFFF,0.7);
directionalLight.position.set(200,0,300);
directionalLight.castShadow = true;
scene.add(directionalLight);

//CAMERA
var raycaster = new THREE.Raycaster();
camera.position.z = 400;
camera.position.y = -300;
camera.lookAt(0,0,0);

//const helper = new THREE.CameraHelper( directionalLight.shadow.camera );
//scene.add( helper );


//ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);
    selfPlayer = players.filter(obj => {
        return obj.socketID == socket.id;
    });
    selfFlashLight = playersFlashlights.filter(obj => { 
        return obj.socketID == socket.id;
    });
    if (selfPlayersCreated > 0) {
        if (window.Wpressed) {
            selfPlayer[0].position.y += PLAYER_VELOCITY;
            selfFlashLight[0].position.y += PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 1) //1 = up
        }
        if (window.Apressed) {
            selfPlayer[0].position.x -= PLAYER_VELOCITY;
            selfFlashLight[0].position.x -= PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 2) //2 = left
        }
        if (window.Spressed) {
            selfPlayer[0].position.y -= PLAYER_VELOCITY;
            selfFlashLight[0].position.y -= PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 3) //3 = down
        }
        if (window.Dpressed) {
            selfPlayer[0].position.x += PLAYER_VELOCITY;
            selfFlashLight[0].position.x += PLAYER_VELOCITY;
            socket.emit('player movement', socket.id, 4) //4 = right
        }
        if (window.Spacepressed) {
            selfFlashLight[0].visible = true;
            socket.emit('player flashlight toggle', socket.id, selfFlashLight[0].visible);
        }
        if (window.Space_unpressed) {
            selfFlashLight[0].visible = false;
            socket.emit('player flashlight toggle', socket.id, selfFlashLight[0].visible);
        }
    }
     
    renderer.render(scene, camera);
    //controls.update();
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
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera(mouse.clone(), camera);
    intersects = raycaster.intersectObjects(scene.children);

    if(players.length > 0) {
        if (intersects.length > 0) {
            angle = Math.atan2(intersects[0].point.y, intersects[0].point.x);
        }
        player = players.find(obj=>obj.socketID==socket.id);    
        playerFlashLight = playersFlashlights.find(obj=>obj.socketID==socket.id);
        player.rotation.z = angle
        playerFlashLight.rotation.z = angle + Math.PI/2;
        playerFlashLight.position.x = selfPlayer[0].position.x + Math.cos(selfPlayer[0].rotation.z) * 37.5;
        playerFlashLight.position.y = selfPlayer[0].position.y + Math.sin(selfPlayer[0].rotation.z) * 37.5;
    }
}

document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("keyup", onDocumentKeyUp, false);
document.addEventListener("mousemove", onMouseMove, false);

newPlayerBtn.addEventListener('click', () => {
    selfCreatePlayer();
    newPlayerBtn.style.display = "none";
})


animate();
