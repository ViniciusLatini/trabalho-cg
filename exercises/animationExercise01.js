import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
  initRenderer,
  initDefaultSpotlight,
  initCamera,
  createGroundPlane,
  SecondaryBox,
  onWindowResize
} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit;
scene = new THREE.Scene();
renderer = initRenderer();
light = initDefaultSpotlight(scene, new THREE.Vector3(7.0, 7.0, 7.0), 300);
camera = initCamera(new THREE.Vector3(3.6, 4.6, 8.2));
orbit = new OrbitControls(camera, renderer.domElement);

// Show axes 
let axesHelper = new THREE.AxesHelper(5);
axesHelper.translateY(0.1);
scene.add(axesHelper);

// "Moving" box
var movingMessage = new SecondaryBox("");
movingMessage.changeStyle("rgba(0,0,0,0)", "yellow", "25px", "ubuntu")

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlane(10, 10, 40, 40); // width, height, resolutionW, resolutionH
groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Create object
let obj = buildObject()
let obj2 = buildObject()
obj.position.set(-5.0, 0.5, -3.0);
obj2.position.set(-5.0, 0.5, 3.0)
scene.add(obj)
scene.add(obj2)

// Variables that will be used for linear interpolation
const lerpConfig = {
  destination1: new THREE.Vector3(5.0, 0.5, -3.0),
  alpha1: 0.01,
  angle: 0.0,
  s1Move: false,
  alpha2: 0.1,
  s2Move: false,
  destination1: new THREE.Vector3(-5.0, 0.5, -3.0),
}

buildInterface();
render();

function buildObject() {
  let size = 0.5
  let geometry = new THREE.SphereGeometry(size);
  let material = new THREE.MeshLambertMaterial({ color: "red" });
  let obj = new THREE.Mesh(geometry, material);
  return obj;
}

function buildInterface() {
  var controls = new function () {
    this.onMoveObject = function () {
      obj.position.set(-5.0, 0.5, 0.0);
    };
    this.onMoveS1 = () => {
      lerpConfig.s1Move = true
    }
  };

  let gui = new GUI();
  let folder = gui.addFolder("Interpolation Options");
  folder.open();
  folder.add(controls, 'onMoveS1').name("MOVE S1");
  folder.add(controls, 'onMoveObject').name("RESET");
}

function render() {
  if (lerpConfig.s1Move) obj.position.lerp(lerpConfig.destination1, lerpConfig.alpha1);
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}