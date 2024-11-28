import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize
} from "../libs/util/util.js";
import { rows } from './utils/map.js'

let scene, renderer, camera, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

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

function loadTrees() {
  fetch("./trees/a1.json")
    .then((res) => {
      return res.json()
    })
    .then(data => {
      const ref = { x: 12.5, y: 1, z: -1.5 }
      data.map(({ position, mesh }) => {
        console.log(mesh);
        const material = setDefaultMaterial(mesh.materials[0].color)
        const voxel = new THREE.Mesh(cubeGeometry, material)
        voxel.position.set(position.x + ref.x, position.y + ref.y, position.z + ref.z)
        scene.add(voxel)
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
let controls = new InfoBox();
controls.add("Builder");
controls.addParagraph();
// controls.add("Use mouse to interact:");
// controls.add("* Left button to rotate");
// controls.add("* Right button to translate (pan)");
// controls.add("* Scroll to zoom in/out.");
// controls.add("* Scroll to zoom in/out.");

render();
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}