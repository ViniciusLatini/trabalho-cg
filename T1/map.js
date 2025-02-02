import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
  initRenderer,
  initDefaultBasicLight,
  onWindowResize,
} from "../libs/util/util.js";
import { SimplexNoise } from '../build/jsm/math/SimplexNoise.js';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import { CharacterController } from './characterController.js';

let scene, renderer, perspectiveCamera, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
perspectiveCamera.position.set(0, 9, 0);
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// Create third person camera
let thirdPersonCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
thirdPersonCam.position.set(0, 5, 5);
scene.add(thirdPersonCam);

// Create orbit controls
const orbitControls = new OrbitControls(thirdPersonCam, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.update();

// Create Steve and its controls
var characterController
new GLTFLoader().load('./utils/steve.glb', function(gltf){
  const model = gltf.scene;
  model.traverse(function (child) {
    if (child.isMesh) child.castShadow = true;
  });
  model.position.set(0, 4, 0);
  scene.add(model);

  const animations = gltf.animations;
  console.log(animations);
  const mixer = new THREE.AnimationMixer(model);
  const animationsMap = new Map()
  animations.filter(a => a.name != 'walking').forEach((a) =>{
    animationsMap.set(a.name, mixer.clipAction(a))
  })

  characterController = new CharacterController(model, mixer, animationsMap, orbitControls, thirdPersonCam)
});

// Add key listeners for character control
const keysPressed = { } // Reserved for character movements
window.addEventListener('keydown', (event) => {
  (keysPressed)[event.key.toLowerCase()] = true
  console.log(event.key.toString())
  if(event.key == " "){
    characterController.jump()
  }
}, false);
window.addEventListener('keyup', (event) => {
  (keysPressed)[event.key.toLowerCase()] = false
}, false);

const mapSize = 100

let fogFar = 100
scene.fog = new THREE.Fog(0xaaaaaa, 1, 96);
scene.background = new THREE.Color(0xaaaaaa);

const heightMatrix = Array(mapSize * 2).fill().map(() => Array(mapSize * 2).fill(0));

const stats = new Stats()
document.getElementById("webgl-output").appendChild(stats.domElement);

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(thirdPersonCam, renderer) }, false);

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const grassMaterial = new THREE.MeshLambertMaterial({ color: '#226923' })
// Criação de instâncias para cada material
const grassMesh = new THREE.InstancedMesh(boxGeometry, grassMaterial, 40000);
// Contadores de instâncias
let grassIndex = 0;
//Indicando para GPU que essas informações serão atualizadas com frequência
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
  const response = await fetch(`./trees/a${idx%3 + 1}.json`);
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

// Use this to show information onscreen
// let controls = new InfoBox();
// controls.add("Basic Scene");
// controls.addParagraph();
// controls.add("Use mouse to interact:");
// controls.add("* Left button to rotate");
// controls.add("* Right button to translate (pan)");
// controls.add("* Scroll to zoom in/out.");
// controls.show();

generateProceduralMap()
renderTrees()
const clock = new THREE.Clock();
render();
function render() {
  let mixerUpdateDelta = clock.getDelta();
  if (characterController){
    characterController.update(mixerUpdateDelta, keysPressed);
  }
  orbitControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, thirdPersonCam) // Render scene
  grassMesh.frustumCulled = true;
  stats.update();
}