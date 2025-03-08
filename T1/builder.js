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

let scene, renderer, camera, material, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.
let heightIndicatorStack = []
let currentVox = 0
let voxels = {}
let jsonName = 'tree'
const dirtSrc = './assets/dirt.png'
const grassSideSrc = './assets/grass_block_side.png'
const grassTopSrc = './assets/grass_block_top.png'

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

// Criação do cubo preview (Wireframe)
const boxWireframe = new THREE.BoxGeometry(1, 1, 1);
const wireframe = new THREE.WireframeGeometry(boxWireframe);
const wireframeMaterial = new THREE.LineBasicMaterial({
  color: voxelsTypes[currentVox].color,
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
  wireframeMaterial.color.set(voxelsTypes[currentVox].color)
}

function hashPosition(position) {
  const { x, y, z } = position
  return `${x},${y},${z}`
}

function createTexturedCube(sideTextureUrl, topTextureUrl, bottomTextureUrl) {
  const textureLoader = new THREE.TextureLoader();
  const sideTexture = textureLoader.load(sideTextureUrl);
  const topTexture = textureLoader.load(topTextureUrl);
  const bottomTexture = textureLoader.load(bottomTextureUrl);
  
  // Configurar para repetir a textura corretamente
  sideTexture.wrapS = THREE.RepeatWrapping;
  sideTexture.wrapT = THREE.RepeatWrapping;
  topTexture.wrapS = THREE.RepeatWrapping;
  topTexture.wrapT = THREE.RepeatWrapping;
  bottomTexture.wrapS = THREE.RepeatWrapping;
  bottomTexture.wrapT = THREE.RepeatWrapping;
  
  // Ajustar intensidade da textura
  sideTexture.encoding = THREE.sRGBEncoding;
  topTexture.encoding = THREE.sRGBEncoding;
  bottomTexture.encoding = THREE.sRGBEncoding;
  
  // Melhorar a qualidade das texturas
  sideTexture.minFilter = THREE.LinearMipmapLinearFilter;
  sideTexture.magFilter = THREE.LinearFilter;
  topTexture.minFilter = THREE.LinearMipmapLinearFilter;
  topTexture.magFilter = THREE.LinearFilter;
  bottomTexture.minFilter = THREE.LinearMipmapLinearFilter;
  bottomTexture.magFilter = THREE.LinearFilter;
  
  const materials = [
      new THREE.MeshStandardMaterial({ map: sideTexture, roughness: 0.5, metalness: 0.3 }), // Right
      new THREE.MeshStandardMaterial({ map: sideTexture, roughness: 0.5, metalness: 0.3 }), // Left
      new THREE.MeshStandardMaterial({ map: topTexture, roughness: 0.5, metalness: 0.3 }),  // Top
      new THREE.MeshStandardMaterial({ map: bottomTexture, roughness: 0.5, metalness: 0.3 }), // Bottom
      new THREE.MeshStandardMaterial({ map: sideTexture, roughness: 0.5, metalness: 0.3 }), // Front
      new THREE.MeshStandardMaterial({ map: sideTexture, roughness: 0.5, metalness: 0.3 })  // Back
  ];
  
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const cube = new THREE.Mesh(geometry, materials);
  
  return cube;
}

function createVoxel() {
  const hash = hashPosition(line.position)
  // Verifica se já existe voxel nessa posição
  if (voxels[hash])
    return

  // Criação do voxel
  // const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
  // const cubeMaterial = setDefaultMaterial(voxelsTypes[currentVox])
  // const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  const cube = createTexturedCube(voxelsTypes[currentVox].sideSrc, voxelsTypes[currentVox].topSrc, voxelsTypes[currentVox].botSrc)
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

function decodePosition(position) {
  const values = position.split(',')
  return {
    x: Number(values[0]),
    y: Number(values[1]),
    z: Number(values[2]),
  }
}

function buildInterface() {
  var controls = new function () {
    this.reset = function () {
      Object.values(voxels).forEach(item => scene.remove(item))
      voxels = {}
    };
    this.save = () => {
      const obj = Object.entries(voxels).map(item => ({ position: decodePosition(item[0]), mesh: item[1] }))
      const jsonString = JSON.stringify(obj, null, 1)
      const blob = new Blob([jsonString], { type: "application/json" });
      // Cria um link de download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = jsonName;
      // Aciona o download
      link.click();

      // Libera a memória usada pelo Blob
      URL.revokeObjectURL(link.href);
    };
    this.load = () => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
      fetch(`./loadTree/${jsonName}.json`)
        .then(res => { return res.json() })
        .then(data => {
          data.map(({ position, mesh }) => {
            const material = setDefaultMaterial(mesh.materials[0].color)
            const voxel = new THREE.Mesh(cubeGeometry, material)
            voxel.position.set(position.x, position.y, position.z)
            scene.add(voxel)
          })
        })
        .catch(error => {
          alert('Erro ao carregar arquivo')
        })
    }
  };

  let gui = new GUI();
  const params = {
    textField: "tree"
  }

  let folder = gui.addFolder("Builder Options");
  folder.open();
  folder.add(params, "textField").name('Nome arquivo').onFinishChange(value => { jsonName = value });
  folder.add(controls, 'save').name("SALVAR");
  folder.add(controls, 'load').name("CARREGAR");
  folder.add(controls, 'reset').name("RESET");
}

// Use this to show information onscreen
let controls = new InfoBox();
controls.add("Builder");
controls.addParagraph();
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