// Imports
import * as THREE from 'three';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js'
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  onWindowResize
} from "../libs/util/util.js";
import { rows } from './utils/map.js';
import { CharacterController } from './characterController.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

let scene, renderer, firstPersonCamera, inspectionCamera, currentCamera, material, light, orbit, controls;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer

// Create third person camera
let thirdPersonCam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
thirdPersonCam.position.set(0, 5, 5);
scene.add(thirdPersonCam);

// Create orbit controls
const orbitControls = new OrbitControls(thirdPersonCam, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 10;
orbitControls.maxDistance = 25;
orbitControls.enablePan = false;
orbitControls.update();

material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

var characterController
new GLTFLoader().load('./utils/steve.glb', function(gltf){
  const model = gltf.scene;
  model.traverse(function (child) {
    if (child.isMesh) child.castShadow = true;
  });
  model.position.set(0, 4, 0);
  scene.add(model);

  const animations = gltf.animations;
  const mixer = new THREE.AnimationMixer(model);
  const animationsMap = new Map()
  animations.filter(a => a.name != 'TPose').forEach((a) =>{
    animationsMap.set(a.name, mixer.clipAction(a))
  })

  characterController = new CharacterController(model, mixer, animationsMap, orbitControls, thirdPersonCam, 'Idle')
});

function onError(){ };

function onProgress(xhr, model){
    if (xhr.lengthComputable){
      var percentComplete = xhr.loaded / xhr.total * 100;
    }
}

function changeCamera() {
  if (currentCamera == firstPersonCamera) {
    currentCamera = inspectionCamera;
    controls.unlock();
  } else {
    currentCamera = firstPersonCamera;
    controls.lock();
  }
}

const speed = 10;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

// Add key listeners for character control
const keysPressed = { }
window.addEventListener('keydown', (event) => {
  (keysPressed)[event.key.toLowerCase()] = true
}, false);
window.addEventListener('keyup', (event) => {
  (keysPressed)[event.key.toLowerCase()] = false
}, false);

function moveAnimate(delta) {
  if (moveForward) {
    controls.moveForward(speed * delta);
  }
  else if (moveBackward) {
    controls.moveForward(speed * -1 * delta);
  }

  if (moveRight) {
    controls.moveRight(speed * delta);
  }
  else if (moveLeft) {
    controls.moveRight(speed * -1 * delta);
  }

  if (moveUp && camera.position.y <= 100) {
    camera.position.y += speed * delta;
  }
  else if (moveDown) {
    camera.position.y -= speed * delta;
  }
}

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(currentCamera, renderer) }, false);

// Create terrain function
const terrainColor = ['rgb(0,200,0)', 'rgb(255,150,0)', 'rgb(255,255,255)'];
function createTerrainBlock(type, x, z) {
  const geometry = new THREE.BoxGeometry;
  const material = setDefaultMaterial(terrainColor[type]);
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(x, 0.5 + type, z);
  scene.add(cube);
}

function createTerrain() {
  let posX = -17.0;
  let posZ = -17.0;
  rows.map(row => {
    for (let i = 0; i <= row.n2L; i++) {
      createTerrainBlock(2, posX, posZ);
      posX++;
    }
    for (let i = row.n2L + 1; i <= row.n1L; i++) {
      createTerrainBlock(1, posX, posZ);
      posX++;
    }
    for (let i = row.n1L + 1; i <= row.n0; i++) {
      createTerrainBlock(0, posX, posZ);
      posX++;
    }
    for (let i = row.n0 + 1; i <= row.n1R; i++) {
      createTerrainBlock(1, posX, posZ);
      posX++;
    }
    for (let i = row.n1R + 1; i <= row.n2R; i++) {
      createTerrainBlock(2, posX, posZ);
      posX++;
    }
    posX = -17.0;
    posZ++;
  })
}

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

const trees = [
  {
    path: "./trees/a1.json",
    ref: { x: 12.5, y: 1, z: -1.5 }
  },
  {
    path: "./trees/a2.json",
    ref: { x: 9.5, y: 1, z: -11.5 }
  },
  {
    path: "./trees/a3.json",
    ref: { x: 9.5, y: 1, z: 10.5 }
  },
  {
    path: "./trees/a3.json",
    ref: { x: -4.5, y: 1, z: -1.5 }
  },
  {
    path: "./trees/a1.json",
    ref: { x: -5.5, y: 1, z: -11.5 }
  },
  {
    path: "./trees/a2.json",
    ref: { x: -6.5, y: 1, z: 10.5 }
  },

]

function loadTrees() {
  trees.map(({ path, ref }) => {
    fetch(path)
      .then((res) => {
        return res.json()
      })
      .then(data => {
        data.map(({ position, mesh }) => {
          const material = setDefaultMaterial(mesh.materials[0].color)
          const voxel = new THREE.Mesh(cubeGeometry, material)
          voxel.position.set(position.x + ref.x, position.y + 1 + ref.y, position.z + ref.z)
          scene.add(voxel)
        })
      })
  })
}


// Criação do plano quadriculado
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(35, 35),
  new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    visible: false
  })
);
plane.rotateX(-Math.PI / 2);
scene.add(plane);
const grid = new THREE.GridHelper(35, 35);
scene.add(grid);

// Criação da matriz de terreno
createTerrain();
loadTrees()

// Rendering the scene
const clock = new THREE.Clock();
render();
function render() {
  let mixerUpdateDelta = clock.getDelta();
  if (characterController){
    characterController.update(mixerUpdateDelta, keysPressed);
  }
  orbitControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, thirdPersonCam);
}