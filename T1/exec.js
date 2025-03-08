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
  if (event.key == 'q' || event.key == " Q"){
    if(backgroundMusic.isPlaying) backgroundMusic.pause();
    else backgroundMusic.play();
  }
  if (event.key == 'f' || event.key == 'F') {
    toggleFog();
  }
}, false);

function toggleFog() {
  if (scene.fog) {
    scene.fog = null; // Desabilita a neblina
  } else {
    scene.fog = new THREE.Fog(0xaaaaaa, 1, 96); // Habilita a neblina
  }
}

window.addEventListener('keyup', (event) => {
  (keysPressed)[event.key.toLowerCase()] = false;
}, false);

// Função para deslocar uma instância para baixo
function moveInstanceDown(instancedMesh, instanceId, matrix) {
  // Obtém a posição atual da instância
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);

  // Desloca a posição em 50 unidades para baixo no eixo Y
  position.y -= 50;

  // Cria uma nova matriz com a posição atualizada
  const newMatrix = new THREE.Matrix4();
  newMatrix.compose(position, quaternion, scale);

  // Atualiza a matriz da instância na InstancedMesh
  instancedMesh.setMatrixAt(instanceId, newMatrix);

  // Marca a matriz de instâncias como necessitando de atualização
  instancedMesh.instanceMatrix.needsUpdate = true;
}

const mapSize = 100;
const heightMatrix = Array(mapSize * 2).fill().map(() => Array(mapSize * 2).fill(0));

var characterController = new CharacterController(firstPersonCam, pointerLockControls, heightMatrix);

let mouseX = 0;
let mouseY = 0;
let isPointerLocked = false;

const crosshair = document.getElementById('crosshair');

document.addEventListener('mousedown', (event) => {
  if (event.button === 2) {
    characterController.jump();
  }
});

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
const leavesSrc = './assets/leaves.png'
const logSrc = './assets/log.png'
const logTopSrc = './assets/log_top.png'

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

const waterMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x3FA9F5,
  transparent: true,
  opacity: 0.6,
  roughness: 0.3,
  metalness: 0.1,
  reflectivity: 0.5,
  transmission: 0.9, 
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
});
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
      if (height < 1) {
        const waterBlock = new THREE.Mesh(boxGeometry, waterMaterial);
        waterBlock.position.set(i, height, j);
        scene.add(waterBlock);
        heightMatrix[i + mapSize][j + mapSize] = height - 1;
      } else {
        setInstance(grassMesh, grassIndex++, { x: i, y: height, z: j });
      }

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

    if(color == 25600){
      const leavesTexture = textureLoader.load(leavesSrc);
      leavesTexture.wrapS = leavesTexture.wrapT = THREE.RepeatWrapping;
      leavesTexture.encoding = THREE.sRGBEncoding;
      
      leavesTexture.minFilter = THREE.LinearMipmapLinearFilter;
      leavesTexture.magFilter = THREE.LinearFilter;
      
      const leavesMaterial = [
        new THREE.MeshLambertMaterial({ map: leavesTexture, transparent: true }), // Right
        new THREE.MeshLambertMaterial({ map: leavesTexture, transparent: true }), // Left
        new THREE.MeshLambertMaterial({ map: leavesTexture, transparent: true }),  // Top
        new THREE.MeshLambertMaterial({ map: leavesTexture, transparent: true }), // Bottom
        new THREE.MeshLambertMaterial({ map: leavesTexture, transparent: true }), // Front
        new THREE.MeshLambertMaterial({ map: leavesTexture, transparent: true })  // Back
      ];
      const leavesVoxel = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), leavesMaterial);
      // Ajuste de posição baseado no referencial
      leavesVoxel.position.set(
      position.x + ref.x + 0.5,
      position.y + ref.y,
      position.z + ref.z + 0.5
      );
      leavesVoxel.castShadow = true;
      group.add(leavesVoxel);
    }
    if(color == 6900535){
      const logTexture = textureLoader.load(logSrc);
      const logTopTexture = textureLoader.load(logTopSrc);
      const logMaterial = [
        new THREE.MeshLambertMaterial({ map: logTexture }), // Right
        new THREE.MeshLambertMaterial({ map: logTexture }), // Left
        new THREE.MeshLambertMaterial({ map: logTopTexture }),  // Top
        new THREE.MeshLambertMaterial({ map: logTopTexture }), // Bottom
        new THREE.MeshLambertMaterial({ map: logTexture }), // Front
        new THREE.MeshLambertMaterial({ map: logTexture })  // Back
      ];
      const logVoxel = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), logMaterial);
      // Ajuste de posição baseado no referencial
      logVoxel.position.set(
      position.x + ref.x + 0.5,
      position.y + ref.y,
      position.z + ref.z + 0.5
      );
      logVoxel.castShadow = true;
      group.add(logVoxel);
    }
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

// Configuração da Caixa de Destaque
const highlightMaterial = new THREE.MeshBasicMaterial({
  color: 0xeeeeee,
  transparent: true,
  opacity: 0.5
});
const highlightGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01); // Aumente ligeiramente o tamanho para evitar z-fighting
let highlightBox = new THREE.Mesh(highlightGeometry, highlightMaterial);
highlightBox.visible = false; // Inicialmente invisível
scene.add(highlightBox);

// Configuração do Raycaster
const raycaster = new THREE.Raycaster();
raycaster.far = 7;
const pointer = new THREE.Vector2();

function onPointerMove(event) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

// Configuração da Música de Fundo e SFX de Remoção de Bloco
const audioListener = new THREE.AudioListener();
firstPersonCam.add(audioListener);
const audioLoader = new THREE.AudioLoader();
const backgroundMusic = new THREE.Audio(audioListener);
const removeSFX = new THREE.Audio(audioListener);

audioLoader.load('./sfx/backgroundmusic.mp3', function (buffer){
  backgroundMusic.setBuffer(buffer);
  backgroundMusic.setLoop(true);
  backgroundMusic.setVolume(0.4);
  backgroundMusic.play();
})
audioLoader.load('./sfx/pop.mp3', function (buffer){
  removeSFX.setBuffer(buffer);
  removeSFX.setLoop(false);
  removeSFX.setVolume(0.5);
})

document.addEventListener('click', (event) => {
  if (event.button === 0 && selectedVoxel) { // Clique esquerdo
    if (selectedVoxel?.isInstancedMesh) {
      const instanceId = raycaster.intersectObjects([selectedVoxel], false)[0]?.instanceId;
      if (instanceId !== undefined) {
        selectedVoxel.setMatrixAt(instanceId, new THREE.Matrix4().makeTranslation(9999, 9999, 9999));
        selectedVoxel.instanceMatrix.needsUpdate = true;
        const {x, z} = highlightBox.position
        heightMatrix[x + mapSize][z + mapSize] -= 1; 
        removeSFX.play();
      }
    } 
  }
});

generateProceduralMap();
renderTrees();
const clock = new THREE.Clock();
var selectedVoxel;
render();
function render() {
  raycaster.setFromCamera(pointer, firstPersonCam);
  const intersects = raycaster.intersectObjects(scene.children, false);
  if (intersects.length > 0) {
    const instanceId = intersects[1]?.instanceId;
    selectedVoxel = intersects[1]?.object;
    if(selectedVoxel?.isInstancedMesh){
      const position = new THREE.Vector3();
      const tMatrix = new THREE.Matrix4();
      selectedVoxel.getMatrixAt(instanceId, tMatrix);
      position.setFromMatrixPosition(tMatrix);
      highlightBox.position.copy(position);
      highlightBox.visible = true;
    }
  }else{
    highlightBox.visible = false;
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