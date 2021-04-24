

//SCENE AND RENDERER SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color('#66b8c4');
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer( {canvas: sceneCanvas} );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//PLANE
texture = new THREE.TextureLoader().load('/public/assets/checker.png');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set( 4, 4 );
const planeGeom = new THREE.PlaneGeometry(700,700,1);
const planeMaterial = new THREE.MeshStandardMaterial( {map: texture} );
const plane = new THREE.Mesh(planeGeom, planeMaterial);
plane.receiveShadow = true;

//LIGHTING
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
const directionalLight = new THREE.SpotLight(0xFFFFFF,0.7, 5000);
directionalLight.position.set(100,0,500);
directionalLight.castShadow = true;

//CAMERA
var raycaster = new THREE.Raycaster();  
camera.position.z = 400;
camera.position.y = -300;
camera.lookAt(0,0,0);
