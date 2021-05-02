

//SCENE AND RENDERER SETUP
const scene = new THREE.Scene();
var importedMaps = [];
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
    loader.load('/public/assets/maps/map_v0.1.glb', function (gltf) {
        modelMaterial = new THREE.MeshStandardMaterial( {'color': 'red'} );
        gltf.scene.traverse((o) => {
            if(o.name == "Plane") {importedMaps.push(o)}
        });
        
        importedMaps[0].rotation.x = Math.PI/2;
        importedMaps[0].material = modelMaterial;
        importedMaps[0].receiveShadow = true;
        importedMaps[0].castShadow = true;
        
        scene.add(importedMaps[0])
        callback(importedMaps[0])
    });
}



//LIGHTING
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
const directionalLight = new THREE.SpotLight(0xFFFFFF,0.7, 5000);
directionalLight.position.set(300,0,600);
directionalLight.castShadow = true;

//CAMERA
var raycaster = new THREE.Raycaster();  
camera.position.z = 550;
camera.position.y = 0;
camera.position.x = 0;
camera.lookAt(0,0,0);
