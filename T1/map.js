import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize,
  createGroundPlaneXZ
} from "../libs/util/util.js";
import { SimplexNoise } from '../build/jsm/math/SimplexNoise.js';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js';

let scene, renderer, camera, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 50, 50)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.

let fogFar = 100
scene.fog = new THREE.Fog(0xaaaaaa, 1, 100);

const stats = new Stats()
document.getElementById("webgl-output").appendChild(stats.domElement);

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const materials = {
  rock: new THREE.MeshPhongMaterial({ color: '#575757' }),
  soil: new THREE.MeshPhongMaterial({ color: '#4A3424' }),
  grass: new THREE.MeshPhongMaterial({ color: '#226923' }),
};
const simplex = new SimplexNoise();

// Criação de instâncias para cada material
const rockMesh = new THREE.InstancedMesh(boxGeometry, materials.rock, 100000);
const soilMesh = new THREE.InstancedMesh(boxGeometry, materials.soil, 100000);
const grassMesh = new THREE.InstancedMesh(boxGeometry, materials.grass, 100000);

// Contadores de instâncias
let rockIndex = 0;
let soilIndex = 0;
let grassIndex = 0;

//Indicando para GPU que essas informações serão atualizadas com frequência
rockMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
soilMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

// Função para definir a instância
function setInstance(mesh, index, position) {
  const matrix = new THREE.Matrix4();
  matrix.setPosition(position.x, position.y, position.z);
  mesh.setMatrixAt(index, matrix);
}

function makeColumn(height, position) {
  for (let i = 0; i < height; i++) {
    let mesh, idx;

    if (i < height - 4) {
      mesh = rockMesh;
      idx = rockIndex++;
    }
    else if (i < height - 2) {
      mesh = soilMesh;
      idx = soilIndex++;
    }
    else {
      mesh = grassMesh;
      idx = grassIndex++;
    }
    setInstance(mesh, idx, { x: position.x, y: i + 0.5, z: position.z });
  }
}

for (let i = -50; i <= 50; i++) {
  for (let j = -50; j <= 50; j++) {
    const noise = Math.pow((simplex.noise(i / 30, j / 30) + 1) / 2, 1.5);
    const height = Math.round(noise * 20);
    makeColumn(height, { x: i, z: j });
  }
}

// Atualizar os contadores de instância
rockMesh.instanceMatrix.needsUpdate = true;
soilMesh.instanceMatrix.needsUpdate = true;
grassMesh.instanceMatrix.needsUpdate = true;

// Adicionar as instâncias à cena
scene.add(rockMesh);
scene.add(soilMesh);
scene.add(grassMesh);

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

render();
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
  stats.update();
}