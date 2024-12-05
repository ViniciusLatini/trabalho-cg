import * as THREE from 'three';
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize
} from "../libs/util/util.js";
import { rows } from './utils/map.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

let scene, renderer, firstPersonCamera, inspectionCamera, currentCamera, material, light, orbit, controls;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer

firstPersonCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
firstPersonCamera.position.set(3, 3, -7);
firstPersonCamera.lookAt(new THREE.Vector3(0, 2, 0));
scene.add(firstPersonCamera);

inspectionCamera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position (DEFAULT CAMERA)
scene.add(inspectionCamera);

currentCamera = firstPersonCamera;

material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
controls = new PointerLockControls(firstPersonCamera, renderer.domElement);
orbit = new OrbitControls(inspectionCamera, renderer.domElement);
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');

instructions.addEventListener('click', function () {

  controls.lock();

}, false);

controls.addEventListener('lock', function () {
  instructions.style.display = 'none';
  blocker.style.display = 'none';
});

controls.addEventListener('unlock', function () {
  blocker.style.display = 'block';
  instructions.style.display = '';
});
scene.add(controls.getObject());

function changeCamera(){
  if(currentCamera==firstPersonCamera)
    currentCamera = inspectionCamera;
  else
    currentCamera = firstPersonCamera;
}

const speed = 10;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

window.addEventListener('keydown', (event) => movementControls(event.keyCode, true));
window.addEventListener('keyup', (event) => movementControls(event.keyCode, false));
window.addEventListener('keydown', (event) => {
  switch(event.key){
    case 'c':
      changeCamera();
      break;
    case 'C':
      changeCamera();
      break;
  }
})

function movementControls(key, value) {
  switch (key) {
    case 87: // W
      moveForward = value;
      break;
    case 83: // S
      moveBackward = value;
      break;
    case 65: // A
      moveLeft = value;
      break;
    case 68: // D
      moveRight = value;
      break;
    case 32:
      moveUp = value;
      break;
    case 16:
      moveDown = value;
      break;
  }
}

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
    ref: { x: 12.5, y: 2, z: -1.5 }
  },
  {
    path: "./trees/a2.json",
    ref: { x: 9.5, y: 2, z: -11.5 }
  },
  {
    path: "./trees/a3.json",
    ref: { x: 9.5, y: 2, z: 10.5 }
  },
  {
    path: "./trees/a3.json",
    ref: { x: -4.5, y: 2, z: -1.5 }
  },
  {
    path: "./trees/a1.json",
    ref: { x: -5.5, y: 2, z: -11.5 }
  },
  {
    path: "./trees/a2.json",
    ref: { x: -6.5, y: 2, z: 10.5 }
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
          voxel.position.set(position.x + ref.x, position.y + ref.y, position.z + ref.z)
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

// Use this to show information onscreen
// controls.add("Use mouse to interact:");
// controls.add("* Left button to rotate");
// controls.add("* Right button to translate (pan)");
// controls.add("* Scroll to zoom in/out.");
// controls.add("* Scroll to zoom in/out.");

const clock = new THREE.Clock();
render();
function render() {
  if (controls.isLocked) {
    moveAnimate(clock.getDelta());
  }
  requestAnimationFrame(render);
  renderer.render(scene, currentCamera); // Render scene
}