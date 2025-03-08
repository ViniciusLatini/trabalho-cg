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
import { CharacterController } from './characterController.js';

let scene, renderer, inspectionCamera, currentCamera;
scene = new THREE.Scene();    
renderer = initRenderer();    
inspectionCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
inspectionCamera.position.set(10, 9, 10);
scene.add(inspectionCamera);

// Criação da camera em 1ª pessoa
let firstPersonCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
firstPersonCam.position.set(0, 15, 15);
scene.add(firstPersonCam);
currentCamera = firstPersonCam;

const pointerLockControls = new PointerLockControls(firstPersonCam, renderer.domElement);
scene.add(pointerLockControls.getObject()); // Add the camera to the scene

const orbitControls = new OrbitControls(inspectionCamera, renderer.domElement);
orbitControls.enableDamping = true; // Suaviza o movimento da câmera
orbitControls.update();

document.addEventListener('click', () => {
  if (currentCamera === firstPersonCam) {
    pointerLockControls.lock();
  }
});

function changeCamera() {
  if (currentCamera == firstPersonCam) {
    currentCamera = inspectionCamera;
    pointerLockControls.unlock(); // Desativa PointerLockControls
    orbitControls.enabled = true; // Ativa OrbitControls para a câmera de inspeção
  } else {
    currentCamera = firstPersonCam;
    orbitControls.enabled = false; // Desativa OrbitControls
    pointerLockControls.lock(); // Ativa PointerLockControls
  }
}

const speed = 10;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

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

const mapSize = 100;
const heightMatrix = Array(mapSize * 2).fill().map(() => Array(mapSize * 2).fill(0));

var characterController = new CharacterController(firstPersonCam, pointerLockControls, heightMatrix);

let mouseX = 0;
let mouseY = 0;
let isPointerLocked = false;

const crosshair = document.getElementById('crosshair');

// Listener para o bloqueio do ponteiro
pointerLockControls.addEventListener('lock', () => {
  isPointerLocked = true;
  crosshair.style.display = 'block'; // Mostra a mira
});

pointerLockControls.addEventListener('unlock', () => {
  isPointerLocked = false;
  crosshair.style.display = 'none'; // Oculta a mira
});

let fogFar = 100;
scene.fog = new THREE.Fog(0xaaaaaa, 1, 96);
scene.background = new THREE.Color(0xaaaaaa);

const stats = new Stats();
document.getElementById("webgl-output").appendChild(stats.domElement);

window.addEventListener('resize', function () { onWindowResize(currentCamera, renderer) }, false);

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const textureLoader = new THREE.TextureLoader();
const dirtSrc = './assets/dirt.png'
const grassSideSrc = './assets/grass_block_side.png'
const grassTopSrc = './assets/grass_block_top.png'

function createIntanceMeshTexture(sideTextureSrc, topTextureSrc, bottomTextureSrc, amount) {
  const sideTexture = textureLoader.load(sideTextureSrc);
  const topTexture = textureLoader.load(topTextureSrc);
  const bottomTexture = textureLoader.load(bottomTextureSrc);
  
  // Configurar as texturas
  sideTexture.wrapS = sideTexture.wrapT = THREE.RepeatWrapping;
  topTexture.wrapS = topTexture.wrapT = THREE.RepeatWrapping;
  bottomTexture.wrapS = bottomTexture.wrapT = THREE.RepeatWrapping;
  
  sideTexture.encoding = topTexture.encoding = bottomTexture.encoding = THREE.sRGBEncoding;
  
  sideTexture.minFilter = topTexture.minFilter = bottomTexture.minFilter = THREE.LinearMipmapLinearFilter;
  sideTexture.magFilter = topTexture.magFilter = bottomTexture.magFilter = THREE.LinearFilter;
  
  const material = [
    new THREE.MeshLambertMaterial({ map: sideTexture }), // Right
    new THREE.MeshLambertMaterial({ map: sideTexture }), // Left
    new THREE.MeshLambertMaterial({ map: topTexture }),  // Top
    new THREE.MeshLambertMaterial({ map: bottomTexture }), // Bottom
    new THREE.MeshLambertMaterial({ map: sideTexture }), // Front
    new THREE.MeshLambertMaterial({ map: sideTexture })  // Back
  ];

  return new THREE.InstancedMesh(boxGeometry, material, amount);
}

const grassMesh = createIntanceMeshTexture(grassSideSrc, grassTopSrc, dirtSrc, 40000);
const dirtMesh = createIntanceMeshTexture(dirtSrc, dirtSrc, dirtSrc, 40000);

// Contadores de instâncias
let grassIndex = 0;
let dirtIndex = 0;

// Indicando para GPU que essas informações serão atualizadas com frequência
dirtMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
dirtMesh.receiveShadow = true;
dirtMesh.castShadow = true;
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
      setInstance(dirtMesh, dirtIndex++, { x: i, y: height-1, z: j });
    }
  }

  grassMesh.instanceMatrix.needsUpdate = true;
  dirtMesh.instanceMatrix.needsUpdate = true;
  scene.add(grassMesh);
  scene.add(dirtMesh);
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

// Configuração do Skybox
// Carregando o cubemap
const cubeMapLoader = new THREE.CubeTextureLoader();
const cubeMapTexture = cubeMapLoader.load([
    './assets/skybox/px.png', // direita
    './assets/skybox/nx.png', // esquerda
    './assets/skybox/py.png', // topo
    './assets/skybox/ny.png', // base
    './assets/skybox/pz.png', // frente
    './assets/skybox/nz.png'  // trás
]);

// Aplicando o cubemap como fundo da cena
scene.background = cubeMapTexture;

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

// Configuração do Raycaster
let highlightBox = null;
const highColor = new THREE.Color().setHex(0xffffff);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove(event) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function removeHighlight() {
  if (highlightBox) {
    scene.remove(highlightBox); // Remove o destaque
    highlightBox = null;
  }
}

generateProceduralMap();
renderTrees();
const clock = new THREE.Clock();
render();
function render() {
  raycaster.setFromCamera(pointer, firstPersonCam);

  const intersects = raycaster.intersectObjects(scene.children, false);
  if (intersects.length > 0) {
    const instanceId = intersects[0].instanceId;
    const selectedVoxel = intersects[0].object;
    if(selectedVoxel.isMesh){
      console.log("é uma mesh");
    }
  } else {
    removeHighlight();
  }

  let delta = clock.getDelta();
  if (characterController) {
    characterController.update(delta, keysPressed);
  }
  if (currentCamera === inspectionCamera) {
    orbitControls.update();
  }
  requestAnimationFrame(render);
  renderer.render(scene, currentCamera);
  grassMesh.frustumCulled = true;
  stats.update();
}