import * as THREE from 'three';
import {ARjs}    from  '../libs/AR/ar.js';
import { initAR,
         createSourceChangerInterface} from "../libs/util/utilAR.js"
import {initDefaultSpotlight,
        initRenderer} from "../libs/util/util.js";
import { MeshLambertMaterial } from '../build/three.module.js';

let scene, camera, renderer;
renderer = initRenderer();
   renderer.setClearColor(new THREE.Color('lightgrey'), 0)
   renderer.antialias = true;
scene	= new THREE.Scene();
camera = new THREE.Camera();
   scene.add(camera);
initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20), 4000); // Use default light

//----------------------------------------------------------------------------
// Set AR Stuff
let AR = {
   source: null,
   context: null,
}
initAR(AR, renderer, camera);
setARStuff();
createSourceChangerInterface('../assets/AR/kanjiScene.jpg', '../assets/AR/kanjiScene.mp4')
createHouse();
render();

function render()
{
   updateAR();      
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}

function updateAR()
{
	if( AR.source.ready === false )	return
	AR.context.update( AR.source.domElement )
	scene.visible = camera.visible   
}

async function createHouse()
{
   const response = await fetch(`./assets/house.json`);
   const data = await response.json();
   const group = new THREE.Group();

   data.forEach(({position, mesh}) =>{
      const material = mesh.textures[0];
      const voxel = mesh;

      // Ajuste de posição baseado no referencial
      voxel.position.set(
         position.x / 10,
         position.y / 10,
         position.z / 10
      );
      voxel.castShadow = true;
      group.add(voxel);
   })
   scene.add(group);
}

function setARStuff()
{
   //----------------------------------------------------------------------------
   // initialize arToolkitContext
   AR.context = new ARjs.Context({
      cameraParametersUrl: '../libs/AR/data/camera_para.dat',
      detectionMode: 'mono',
   })

   // initialize it
   AR.context.init(function onCompleted(){
      camera.projectionMatrix.copy( AR.context.getProjectionMatrix() );
   })

   //----------------------------------------------------------------------------
   // Create a ArMarkerControls
   let markerControls;
   markerControls = new ARjs.MarkerControls(AR.context, camera, {	
      type : 'pattern',
      patternUrl : '../libs/AR/data/patt.kanji',
      changeMatrixMode: 'cameraTransformMatrix' 
   })
   // as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
   scene.visible = false
}