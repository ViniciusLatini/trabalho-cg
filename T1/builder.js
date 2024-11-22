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

let scene, renderer, camera, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.

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

const line = new THREE.LineSegments(wireframe);
line.material.depthTest = false;
line.material.opacity = 0.5;
line.position.set(0.5, 0.5, 0.5)
scene.add(line);


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
      line.position.y > 0.5 && line.translateY(-1);
      break;
    case 'PageUp':
      line.position.y < 10.5 && line.translateY(1);
      break;
  }
})

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
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}