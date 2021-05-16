//SCENE AND RENDERER SETUP


//Physijs.scripts.worker = '/public/js/external_dependencies/physijs_worker.js';
//Physijs.scripts.ammo = '/public/js/external_dependencies/ammo.js';

var wallCollisionBoxes = [];

//const scene = new Physijs.Scene;
const scene = new THREE.Scene;
var mapAssets = [];
scene.background = new THREE.Color('#66b8c4');
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer( {canvas: sceneCanvas, antialias: true} );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//PLANE
texture = new THREE.TextureLoader().load('/public/assets/checker.png');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set( 4, 3 );
const planeGeom = new THREE.PlaneGeometry(1000,750,1);
const planeMaterial = new THREE.MeshStandardMaterial( {map: texture} );
const plane = new THREE.Mesh(planeGeom, planeMaterial);
plane.receiveShadow = true;



//MAP LOADING

function loadMap(callback) {

    woodTexture = new THREE.TextureLoader().load('/public/assets/textures/dark-wood-texture.jpg');
    wallMaterial = new THREE.MeshPhongMaterial( {map: woodTexture} );
    floorTexture = new THREE.TextureLoader().load('/public/assets/textures/wood_floor.jpg');
    floorMaterial = new THREE.MeshStandardMaterial( {map: floorTexture} );

    loader.load(MAP_MODEL_FILE, function (gltf) {
        modelMaterial = new THREE.MeshStandardMaterial( {'color': 'gray'} );
        
        var mapFloor;
        var mapWalls = [];
        gltf.scene.traverse((o) => {
            if(o.name == "Plane") {
                mapFloor = o;
            }
            else if (o.name.search("Wall") !== -1){
                mapWalls.push(o);
            }
        });

        mapFloor.rotation.x = Math.PI/2;
        mapFloor.receiveShadow = true;
        mapFloor.castShadow = true;
        mapFloor.material = floorMaterial;
        tempYFloor = mapFloor.position.y;
        mapFloor.position.y = -1*mapFloor.position.z;
        mapFloor.position.z = tempYFloor;


        mapWalls.forEach(mapWall=> {
            mapWall.rotation.x = Math.PI/2;
            tempY = mapWall.position.y;
            mapWall.position.y = -1*mapWall.position.z;
            mapWall.position.z = tempY;
            mapWall.receiveShadow = true;
            mapWall.castShadow = true;
            mapWall.material = wallMaterial;
            mapWall.mapAssetType = "wall";
            collisionBox = new THREE.Box3().setFromObject(mapWall);
            wallCollisionBoxes.push(collisionBox);
            scene.add(mapWall);
        })

        
        
        mapAssets.push(mapFloor);
        mapAssets.push(mapWalls);
        
        scene.add(mapFloor);

        callback(mapAssets)
    });
}



//LIGHTING
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
const directionalLight = new THREE.SpotLight(0xFFFFFF,0.7, 5000);
directionalLight.position.set(100,0,150);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 512;
directionalLight.shadow.mapSize.height = 512;

//CAMERA
var raycaster = new THREE.Raycaster();  
camera.position.z = 100;
camera.position.y = -20;
camera.position.x = 0;
camera.lookAt(0,0,0);
