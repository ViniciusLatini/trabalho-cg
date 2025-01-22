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

function makeCube(height, position, color) {
  let material = new THREE.MeshPhongMaterial(color);
  let cube = new THREE.Mesh(boxGeometry, material);
  cube.position.set(position.x, height + 0.5, position.z);
  scene.add(cube);
}

function makeColumn(height, position) {
  const terrain = {
    rock: '#575757',
    grass: '#226923',
    soil: '#4A3424'
  }

  for (let i = 0; i < height; i++) {
    let color;
    if (i < height - 4) color = terrain.rock;
    else if (i < height - 2) color = terrain.soil;
    else color = terrain.grass;
    makeCube(i, position, { color });
  }
}

function roundHeight(value, step) {
  return Math.round(value / step) * step;
}

const simplex = new SimplexNoise();

for (let i = -20; i <= 20; i++) {
  for (let j = -20; j <= 20; j++) {
    let noise = (simplex.noise(i / 30, j / 30) + 1) / 2;
    noise = Math.pow(noise, 1.5)
    let roundedHeight = roundHeight(noise * 20, 1); // Arredondar a altura para o múltiplo mais próximo
    makeColumn(roundedHeight, { x: i, z: j });
  }
}

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