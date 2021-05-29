const socket = io();

const newPlayerBtn = document.getElementById('newPlayerBtn');
const leaveGameBtn = document.getElementById('leaveGameBtn');

//ASSETS
const PLAYER_MODEL_FILE = "/public/assets/box_v1.2_scaled_down.glb";
const MAP_MODEL_FILE = "/public/assets/maps/map_v0.5.glb";

const siteMenu = document.getElementById('site-menu');
const messageOverlay = document.getElementById('overlay_message');
const distanceToGhostOverlay = document.getElementById('dist_to_ghost');
const roomInfo = document.getElementById('room_info');

const flashLightBatteryElement = document.getElementById('flashLightStatusCard');
const flashLightBatteryProgressBarElement = document.getElementById('flashLightBattery');
const healthStatusCardElement = document.getElementById('healthStatusCard');
const healthProgressBarElement = document.getElementById('playerHealth');

const PLAYER_CREATION_LIMIT = 1;
const SPHERE_RADIUS = 1.5;
var PLAYER_VELOCITY = 0;
const PLAYER_HEIGHT = 10;
const FLASHLIGHT_DIST_FROM_PLAYER = 7;
const FLASHLIGHT_LENGTH = 16;

var roomID = 0;

const playerLightRayCaster = new THREE.Raycaster();

const loader = new THREE.GLTFLoader();