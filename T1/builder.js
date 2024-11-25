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
import { voxelsTypes } from './utils/voxelsTypes.js'
import GUI from '../libs/util/dat.gui.module.js';

let scene, renderer, camera, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.
let heightIndicatorStack = []
let currentVox = 0
let voxels = {}

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper(12);
scene.add(axesHelper);

// Criação do plano quadriculado
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    visible: false
  })
);
plane.rotateX(-Math.PI / 2);
scene.add(plane);
const grid = new THREE.GridHelper(10, 10);
scene.add(grid);

// const highlightMesh = new THREE.Mesh(
//   new THREE.PlaneGeometry(1, 1),
//   new THREE.MeshBasicMaterial({
//     side: THREE.DoubleSide,
//     transparent: true
//   })
// );
// highlightMesh.rotateX(-Math.PI / 2);
// highlightMesh.position.set(0.5, 0, 0.5);
// scene.add(highlightMesh);

// Criação do cubo preview (Wireframe)
const boxWireframe = new THREE.BoxGeometry(1, 1, 1);
const wireframe = new THREE.WireframeGeometry(boxWireframe);
const wireframeMaterial = new THREE.LineBasicMaterial({
  color: voxelsTypes[currentVox],
  depthTest: false,
  opacity: 0.5,
  transparent: true
});
const line = new THREE.LineSegments(wireframe, wireframeMaterial);
line.material.depthTest = false;
line.material.opacity = 0.5;
line.position.set(0.5, 0.5, 0.5)
scene.add(line);

function addHeightIndicator() {
  const sphereGeometry = new THREE.SphereGeometry(0.1);
  const sphereMaterial = setDefaultMaterial('rgb(200,200,200)')
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  heightIndicatorStack.push(sphere)
  sphere.translateY(-1 * heightIndicatorStack.length)
  line.add(sphere)
  line.translateY(1);
}

function removeHeighIndicator() {
  const sphere = heightIndicatorStack.pop()
  line.remove(sphere)
  line.translateY(-1);
}

function changeVoxType(increment) {
  currentVox += increment
  if (currentVox === voxelsTypes.length)
    currentVox = 0
  else if (currentVox === -1)
    currentVox = voxelsTypes.length - 1
  wireframeMaterial.color.set(voxelsTypes[currentVox])
}

function hashPosition(position) {
  const { x, y, z } = position
  return `${x},${y},${z}`
}

function createVoxel() {
  const hash = hashPosition(line.position)
  // Verifica se já existe voxel nessa posição
  if (voxels[hash])
    return

  // Criação do voxel
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
  const cubeMaterial = setDefaultMaterial(voxelsTypes[currentVox])
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  const { x, y, z } = line.position // Capturando posição do wireframe
  // Inserindo voxel na posição do wireframe
  cube.position.set(x, y, z)
  // Inserindo voxel na hashTable sendo tendo a posição x,y,z como chave
  voxels[hash] = cube
  scene.add(cube)
}

function removeVoxel() {
  const hash = hashPosition(line.position)
  // Verifica se existe um voxel nessa posição do wireframe
  if (!voxels[hash])
    return

  // Remove Voxel da cena e da hashTable
  scene.remove(voxels[hash])
  delete voxels[hash]
}

addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowDown':
      line.position.z <= 3.5 && line.translateZ(1);
      break;
    case 'ArrowUp':
      line.position.z >= -3.5 && line.translateZ(-1);
      break;
    case 'ArrowLeft':
      line.position.x >= -3.5 && line.translateX(-1);
      break;
    case 'ArrowRight':
      line.position.x <= 3.5 && line.translateX(1);
      break;
    case 'PageDown':
      line.position.y > 0.5 && removeHeighIndicator()
      break;
    case 'PageUp':
      line.position.y < 10.5 && addHeightIndicator()
      break;
    case 'q':
      createVoxel()
      break;
    case 'Q':
      createVoxel()
      break;
    case 'e':
      removeVoxel()
      break;
    case 'E':
      removeVoxel()
      break;
    case '.':
      changeVoxType(1)
      break;
    case ',':
      changeVoxType(-1)
      break;
  }
})

function buildInterface() {
  var controls = new function () {
    this.reset = function () {
      Object.values(voxels).forEach(item => scene.remove(item))
    };
    this.save = () => {
      const jsonString = JSON.stringify(voxels, null, 1)
      const blob = new Blob([jsonString], { type: "application/json" });
       // Cria um link de download
       const link = document.createElement("a");
       link.href = URL.createObjectURL(blob);
       link.download = "dados.json";

       
       // Aciona o download
       link.click();

       // Libera a memória usada pelo Blob
       URL.revokeObjectURL(link.href);
    }
  };

  let gui = new GUI();
  let folder = gui.addFolder("Builder Options");
  folder.open();
  folder.add(controls, 'save').name("SALVAR");
  folder.add(controls, 'reset').name("RESET");
}

// Use this to show information onscreen
let controls = new InfoBox();
controls.add("Builder");
controls.addParagraph();
// controls.add("Use mouse to interact:");
// controls.add("* Left button to rotate");
// controls.add("* Right button to translate (pan)");
// controls.add("* Scroll to zoom in/out.");
// controls.add("* Scroll to zoom in/out.");
controls.show("Voxels");
controls.add("* Movimentação no plano XZ: Setas direcionais do teclado.");
controls.add("* Movimentação em Y: PgUp e PgDown.");
controls.add("* Inserir voxel: 'Q'.");
controls.add("* Remover voxel: 'E'.");
controls.add("* Próximo tipo de voxel: '.'.");
controls.add("* Tipo anterior de voxel: ','.");

render();
buildInterface();
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}