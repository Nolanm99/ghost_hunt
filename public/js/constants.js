const socket = io();

const newPlayerBtn = document.getElementById('newPlayerBtn');
const leaveGameBtn = document.getElementById('leaveGameBtn');

const siteMenu = document.getElementById('site-menu');
const messageOverlay = document.getElementById('overlay_message');
const roomInfo = document.getElementById('room_info');

const flashLightBatteryElement = document.getElementById('flashLightStatusCard');
const flashLightBatteryProgressBarElement = document.getElementById('flashLightBattery');
const healthStatusCardElement = document.getElementById('healthStatusCard');
const healthProgressBarElement = document.getElementById('playerHealth');

const PLAYER_CREATION_LIMIT = 1;
const SPHERE_RADIUS = 2;
const PLAYER_VELOCITY = 2;
const FLASHLIGHT_DIST_FROM_PLAYER = 25;
const FLASHLIGHT_LENGTH = 68.1;

const playerLightRayCaster = new THREE.Raycaster();

const loader = new THREE.GLTFLoader();