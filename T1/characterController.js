import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class CharacterController{

    constructor(model, mixer, animationsMap, OrbitControl, camera, currentAction) {
        this.model = model
        this.mixer = mixer
        this.animationsMap = animationsMap
        this.currentAction = currentAction;
        this.animationsMap.forEach((value, key) => {
            if (key == this.currentAction){
                value.play()
            }
        })
        this.OrbitControl = OrbitControl;
        this.camera = camera;
    }

    update (delta, keysPressed) {
        this.mixer.update(delta)
    }
}