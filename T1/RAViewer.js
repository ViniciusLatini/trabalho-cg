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

function loadTextureFromBase64(url, callback) {
   const texture = new THREE.Texture();
   const image = new Image();
   image.src = url;
   image.onload = () => {
       texture.image = image;
       texture.needsUpdate = true; // Atualiza a textura após carregar a imagem
       callback(texture);
   };
   image.onerror = (error) => {
       console.error('Erro ao carregar a textura:', error);
       callback(null);
   };
}

async function createHouse()
{
   const response = await fetch(`./assets/house.json`);
   const data = await response.json();
   const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)

    // Mapeamento de UUIDs das imagens para URLs Base64
    const imageMap = new Map();
    data.forEach(obj => {
        if (obj.mesh.images) {
            obj.mesh.images.forEach(image => {
                imageMap.set(image.uuid, image.url); // Mapeia UUID da imagem para URL Base64
            });
        }
    });

    // Carregar todas as texturas primeiro
    const textureMap = new Map();
    for (const obj of data) {
        for (const mat of obj.mesh.materials) {
            const textureUUID = mat.map; // UUID da textura
            if (!textureMap.has(textureUUID)) {
                const imageURL = imageMap.get(textureUUID); // URL Base64 da imagem
                if (imageURL) {
                    await new Promise((resolve) => {
                        loadTextureFromBase64(imageURL, (texture) => {
                            if (texture) {
                                textureMap.set(textureUUID, texture);
                            }
                            resolve();
                        });
                    });
                }
            }
        }
    }

    // Criar os objetos após carregar todas as texturas
    data.forEach(obj => {
        const geometry = new THREE.BoxGeometry(
            obj.mesh.geometries[0].width,
            obj.mesh.geometries[0].height,
            obj.mesh.geometries[0].depth
        );

        const materials = obj.mesh.materials.map(mat => {
            const textureUUID = mat.map; // UUID da textura
            const texture = textureMap.get(textureUUID); // Textura carregada

            return new THREE.MeshStandardMaterial({
                map: texture // Aplica a textura
            });
        });

      const voxel = new THREE.Mesh(cubeGeometry, materials);
      
      voxel.position.set(
         obj.position.x / 10,
         obj.position.y / 10,
         obj.position.z / 10
      );
      scene.add(voxel);
   });
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