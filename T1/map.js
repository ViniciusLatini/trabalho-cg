import * as THREE from 'three';
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js'; // Import PointerLockControls
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js'; // Import OrbitControls
import {
  initRenderer,
  initDefaultBasicLight,
  onWindowResize,
} from "../libs/util/util.js";
import { SimplexNoise } from '../build/jsm/math/SimplexNoise.js';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { CharacterController } from './characterController.js';

let scene, renderer, inspectionCamera, currentCamera, material, light; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
inspectionCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
inspectionCamera.position.set(10, 9, 10);
scene.add(inspectionCamera);
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// Create third person camera
let thirdPersonCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
thirdPersonCam.position.set(0, 5, 5);
scene.add(thirdPersonCam);
currentCamera = thirdPersonCam;

// Create PointerLockControls
const pointerLockControls = new PointerLockControls(thirdPersonCam, renderer.domElement);
scene.add(pointerLockControls.getObject()); // Add the camera to the scene

// Create OrbitControls for inspection camera
const orbitControls = new OrbitControls(inspectionCamera, renderer.domElement);
orbitControls.enableDamping = true; // Suaviza o movimento da câmera
orbitControls.update();

// Enable PointerLockControls on click
document.addEventListener('click', () => {
  if (currentCamera === thirdPersonCam) {
    pointerLockControls.lock();
  }
});

// Create Steve and its controls
var characterController;
function createSteve() {
  new GLTFLoader().load('./utils/steve.glb', function (gltf) {
    const model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) child.castShadow = true;
    });

    model.position.set(0, heightMatrix[100][100] +2, 0);
    scene.add(model);

    const animations = gltf.animations;
    const mixer = new THREE.AnimationMixer(model);
    const animationsMap = new Map();
    animations.filter(a => a.name != 'walking').forEach((a) => {
      animationsMap.set(a.name, mixer.clipAction(a));
    });

    characterController = new CharacterController(model, mixer, animationsMap, thirdPersonCam, pointerLockControls, heightMatrix);
  });
}

function changeCamera() {
  if (currentCamera == thirdPersonCam) {
    currentCamera = inspectionCamera;
    pointerLockControls.unlock(); // Desativa PointerLockControls
    orbitControls.enabled = true; // Ativa OrbitControls para a câmera de inspeção
  } else {
    currentCamera = thirdPersonCam;
    orbitControls.enabled = false; // Desativa OrbitControls
    pointerLockControls.lock(); // Ativa PointerLockControls
  }
}

// Add key listeners for character control
const keysPressed = {}; // Reserved for character movements
window.addEventListener('keydown', (event) => {
  (keysPressed)[event.key.toLowerCase()] = true;
  if (event.key == " ") {
    characterController.jump();
  }
  if (event.key == "c" || event.key == "C") {
    changeCamera();
  }
}, false);
window.addEventListener('keyup', (event) => {
  (keysPressed)[event.key.toLowerCase()] = false;
}, false);

let mouseX = 0;
let mouseY = 0;
let isPointerLocked = false;

// Listener para o movimento do mouse
document.addEventListener('mousemove', (event) => {
  if (isPointerLocked) {
    const sensitivity = 0.002; // Sensibilidade do movimento do mouse
    // Rotação horizontal (camera + personagem)
    mouseX += event.movementX * sensitivity;
    if (characterController) {
      characterController.rotateCharacter(-event.movementX * sensitivity, true); // Rotaciona o personagem
    }
    // Rotação vertical (câmera)
    mouseY += event.movementY * sensitivity;
    mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY)); // Limita a rotação vertical
    if (characterController) {
      characterController.rotateCameraVertical(-event.movementY * sensitivity); // Rotaciona a câmera verticalmente
    }
  }
});

// Listener para o bloqueio do ponteiro
pointerLockControls.addEventListener('lock', () => {
  isPointerLocked = true;
});

pointerLockControls.addEventListener('unlock', () => {
  isPointerLocked = false;
});

const mapSize = 100;

let fogFar = 100;
scene.fog = new THREE.Fog(0xaaaaaa, 1, 96);
scene.background = new THREE.Color(0xaaaaaa);

const heightMatrix = Array(mapSize * 2).fill().map(() => Array(mapSize * 2).fill(0));

const stats = new Stats();
document.getElementById("webgl-output").appendChild(stats.domElement);

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(currentCamera, renderer) }, false);

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const grassMaterial = new THREE.MeshLambertMaterial({ color: '#226923' });
// Criação de instâncias para cada material
const grassMesh = new THREE.InstancedMesh(boxGeometry, grassMaterial, 40000);
// Contadores de instâncias
let grassIndex = 0;
// Indicando para GPU que essas informações serão atualizadas com frequência
grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

// Função para definir a instância
function setInstance(mesh, index, position) {
  const matrix = new THREE.Matrix4();
  matrix.setPosition(position.x, position.y, position.z);
  mesh.setMatrixAt(index, matrix);
}

function generateProceduralMap() {
  const simplex = new SimplexNoise();

  for (let i = (mapSize * -1); i < mapSize; i++) {
    for (let j = (mapSize * -1); j < mapSize; j++) {
      const noise = Math.pow((simplex.noise(i / 70, j / 70) + 1) / 2, 1.5);
      const height = Math.round(noise * 20);
      heightMatrix[i + mapSize][j + mapSize] = height;
      setInstance(grassMesh, grassIndex++, { x: i, y: height, z: j });
    }
  }

  grassMesh.instanceMatrix.needsUpdate = true;
  scene.add(grassMesh);
}

async function loadTree(ref, idx) {
  const response = await fetch(`./trees/a${idx % 3 + 1}.json`);
  const data = await response.json();

  const group = new THREE.Group();

  data.forEach(({ position, mesh }) => {
    const color = mesh.materials[0].color;
    const material = new THREE.MeshLambertMaterial({ color });

    const voxel = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);

    // Ajuste de posição baseado no referencial
    voxel.position.set(
      position.x + ref.x + 0.5,
      position.y + ref.y,
      position.z + ref.z + 0.5
    );

    group.add(voxel);
  });

  scene.add(group);
}

function renderTrees() {
  for (let idx = 0; idx < 20; idx++) {
    const i = Math.floor(Math.random() * mapSize * 2) - mapSize;
    const j = Math.floor(Math.random() * mapSize * 2) - mapSize;
    const positionRef = { x: i, y: heightMatrix[i + mapSize][j + mapSize] - 0.5, z: j };
    loadTree(positionRef, idx);
  }
}

let mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(10, 20, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 150;

const shadowHelper = new THREE.CameraHelper(mainLight.shadow.camera);
scene.add(shadowHelper);
shadowHelper.visible = false;

let secondaryLight = new THREE.DirectionalLight(0xffffff, 0.3);
secondaryLight.position.set(-10, -20, -10);

scene.add(mainLight);
scene.add(secondaryLight);

function updateShadows() {
  mainLight.shadow.camera.left = -fogFar / 2;
  mainLight.shadow.camera.right = fogFar / 2;
  mainLight.shadow.camera.top = fogFar / 2;
  mainLight.shadow.camera.bottom = -fogFar / 2;
  mainLight.shadow.camera.updateProjectionMatrix();
}

updateShadows();
createSteve()

const controls = new function () {
  this.fogFar = fogFar;

  this.updatefogFar = () => {
    scene.fog.far = this.fogFar;
  }
}

const gui = new GUI();

gui.add(controls, 'fogFar', 20, 200)
  .name("Fog Far")
  .onChange(function (e) { controls.updatefogFar(); });

generateProceduralMap();
renderTrees();
const clock = new THREE.Clock();
render();
function render() {
  let mixerUpdateDelta = clock.getDelta();
  if (characterController) {
    characterController.update(mixerUpdateDelta, keysPressed);
  }
  if (currentCamera === inspectionCamera) {
    orbitControls.update(); // Atualiza OrbitControls apenas quando a câmera de inspeção estiver ativa
  }
  requestAnimationFrame(render);
  renderer.render(scene, currentCamera); // Render scene
  grassMesh.frustumCulled = true;
  stats.update();
}