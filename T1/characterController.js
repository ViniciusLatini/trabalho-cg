import * as THREE from 'three'
export const W = 'w'
export const A = 'a'
export const S = 's'
export const D = 'd'
export const DIRECTIONS = [W, A, S, D]
export class CharacterController{
    animationsMap = new Map()
    // Moving data
    walkDirection = new THREE.Vector3()
    rotateAngle = new THREE.Vector3(0, 1, 0)
    rotateQuarternion = new THREE.Quaternion()
    cameraTarget = new THREE.Vector3()
    // Moving constants
    fade = 0.2
    walkVelocity = 7

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
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true)

        var play = 'Armature.001|Walk_Armature_0';
        const toPlay = this.animationsMap.get(play)
        if (directionPressed){
            toPlay.play()
            this.currentAction = 'walking'
        }else{
            toPlay.stop()
            this.currentAction = 'stopped'
        }
        this.mixer.update(delta)
        
        if(this.currentAction == 'walking'){
            // calculate towards camera direction
            var angleYCameraDirection = Math.atan2(
                (this.camera.position.x - this.model.position.x), 
                (this.camera.position.z - this.model.position.z))

            // diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed)

            // rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 1
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            const moveX = this.walkDirection.x * this.walkVelocity * delta
            const moveZ = this.walkDirection.z * this.walkVelocity * delta
            this.model.position.x += moveX
            this.model.position.z += moveZ
            this.updateCamera(moveX, moveZ)
        }
    }

    updateCamera(moveX, moveZ) {
        // move camera
        this.camera.position.x += moveX
        this.camera.position.z += moveZ

        this.cameraTarget.x = this.model.position.x
        this.cameraTarget.y = this.model.position.y + 1
        this.cameraTarget.z = this.model.position.z
        this.OrbitControl.target = this.cameraTarget
    }

    directionOffset(keysPressed) {
        var directionOffset = 0 // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D]) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset
    }
}