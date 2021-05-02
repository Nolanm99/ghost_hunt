

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
/*
function loadMap(callback) {
    loader.load('/public/assets/map_v0.0.glb', function (gltf) {
        //modelMaterial = new THREE.MeshStandardMaterial( {'color': color} );
        gltf.scene.traverse((o) => {
            if(o.name == "Cube") {importedMaps.push(o)}
        });
        
        importedMaps[0].rotation.x = 80;
        
        scene.add(importedMaps[0])
        callback(importedMaps[0])
        //scene.add(importedMap);
    
        //callback(importedCube, importedCone);
    });
}
*/


//LIGHTING
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
const directionalLight = new THREE.SpotLight(0xFFFFFF,0.7, 5000);
directionalLight.position.set(100,0,500);
directionalLight.castShadow = true;

//CAMERA
var raycaster = new THREE.Raycaster();  
camera.position.z = 300;
camera.position.y = 0;
camera.position.x = 0;
camera.lookAt(0,0,0);
