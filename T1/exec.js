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

let scene, renderer, inspectionCamera, currentCamera;
scene = new THREE.Scene();    
renderer = initRenderer();    
inspectionCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
inspectionCamera.position.set(10, 9, 10);
scene.add(inspectionCamera);

// Criação da camera em 3ª pessoa
let thirdPersonCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
thirdPersonCam.position.set(0, 5, 5);
scene.add(thirdPersonCam);
currentCamera = thirdPersonCam;

const pointerLockControls = new PointerLockControls(thirdPersonCam, renderer.domElement);
scene.add(pointerLockControls.getObject()); // Add the camera to the scene

const orbitControls = new OrbitControls(inspectionCamera, renderer.domElement);
orbitControls.enableDamping = true; // Suaviza o movimento da câmera
orbitControls.update();

document.addEventListener('click', () => {
  if (currentCamera === thirdPersonCam) {
    pointerLockControls.lock();
  }
});

// Criação do personagem
var characterController;
let characterModel; // Variável para armazenar o modelo do personagem
function createSteve() {
  new GLTFLoader().load('./utils/steve.glb', function (gltf) {
    const model = gltf.scene;
    model.scale.set(0.50, 0.50, 0.50);
    model.traverse(function (child) {
      if (child.isMesh) child.castShadow = true;
    });

    model.position.set(0, heightMatrix[100][100] + 1.5, 0);
    scene.add(model);
    characterModel = model; // Armazena o modelo do personagem

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

const keysPressed = {};
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

window.addEventListener('resize', function () { onWindowResize(currentCamera, renderer) }, false);

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const grassMaterial = new THREE.MeshLambertMaterial({ color: '#226923' });
// Criação de instâncias para cada material
const grassMesh = new THREE.InstancedMesh(boxGeometry, grassMaterial, 40000);
// Contadores de instâncias
let grassIndex = 0;
// Indicando para GPU que essas informações serão atualizadas com frequência
grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
grassMesh.receiveShadow = true;
grassMesh.castShadow = true;

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
    voxel.castShadow = true;
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

// Configuração da luz direcional principal
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(100, 150, 100);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048; // Tamanho do mapa de sombras
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = mapSize * 3;
mainLight.shadow.camera.left = -mapSize * 1.5;
mainLight.shadow.camera.right = mapSize * 1.5;
mainLight.shadow.camera.top = mapSize * 1.5;
mainLight.shadow.camera.bottom = -mapSize * 1.5;
scene.add(mainLight);

// Configuração da segunda luz direcional (sem sombras)
const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.5);
secondaryLight.position.set(-100, 150, -100);
secondaryLight.castShadow = false;
scene.add(secondaryLight);

// Configuração da luz ambiente
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Helper para visualização do volume de sombra
const shadowHelper = new THREE.CameraHelper(mainLight.shadow.camera);
shadowHelper.visible = false; // Inicialmente desativado
scene.add(shadowHelper);

// Habilitar/desabilitar o helper de sombra
document.addEventListener('keydown', (event) => {
  if (event.key === 'H' || event.key === 'h') {
    shadowHelper.visible = !shadowHelper.visible;
  }
});

createSteve();

const controls = new function () {
  this.fogFar = fogFar;

  this.updatefogFar = () => {
    scene.fog.far = this.fogFar;
    mainLight.shadow.camera.far = this.fogFar * 3;
    mainLight.shadow.camera.left = -this.fogFar * 1.5;
    mainLight.shadow.camera.right = this.fogFar * 1.5;
    mainLight.shadow.camera.top = this.fogFar * 1.5;
    mainLight.shadow.camera.bottom = -this.fogFar * 1.5;
    mainLight.shadow.camera.updateProjectionMatrix();
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
    // Atualiza o target das luzes para seguir o personagem
    if (characterModel) {
      mainLight.target.position.copy(characterModel.position);
      secondaryLight.target.position.copy(characterModel.position);
    }
  }
  if (currentCamera === inspectionCamera) {
    orbitControls.update();
  }
  requestAnimationFrame(render);
  renderer.render(scene, currentCamera);
  grassMesh.frustumCulled = true;
  stats.update();
}