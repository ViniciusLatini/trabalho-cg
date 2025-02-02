import * as THREE from 'three'
export const W = 'w'
export const A = 'a'
export const S = 's'
export const D = 'd'
export const UP = 'arrowup'
export const LEFT = 'arrowleft'
export const RIGHT = 'arrowright'
export const DOWN = 'arrowdown'
export const DIRECTIONS = [W, A, S, D, UP, LEFT, RIGHT, DOWN]
export class CharacterController{
    animationsMap = new Map()
    // Moving data
    walkDirection = new THREE.Vector3()
    rotateAngle = new THREE.Vector3(0, 1, 0)
    rotateQuarternion = new THREE.Quaternion()
    cameraTarget = new THREE.Vector3()
    // Moving constants
    fade = 0.2
    walkVelocity = 10

    constructor(model, mixer, animationsMap, OrbitControl, camera) {
        this.model = model
        this.mixer = mixer
        this.animationsMap = animationsMap
        this.currentAction = '';
        this.OrbitControl = OrbitControl;
        this.camera = camera;
        this.updateCamera(0,0)
    }

    jump () {
        let alpha = 0.01
        let characterY = this.model.position.y
        let jumpHeight = 50
        this.model.position.y = THREE.MathUtils.lerp(characterY, characterY + jumpHeight, alpha)
        this.updateCamera(0, 0);
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
                (this.model.position.x - this.camera.position.x), 
                (this.model.position.z - this.camera.position.z))

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
        // Defina um fator de suavização (entre 0 e 1)
        const lerpFactor = 0.08; // Ajuste este valor para controlar a suavização

        // Verifique se há movimentação em X e Z
        const isMoving = moveX !== 0 || moveZ !== 0;

        // Se houver movimentação, atualize a posição da câmera
        if (isMoving) {
            this.camera.position.x += moveX;
            this.camera.position.z += moveZ;
        }

        // Atualize o alvo da câmera para seguir o personagem
        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.y = this.model.position.y + 2;
        this.cameraTarget.z = this.model.position.z;

        // Interpole suavemente o alvo da câmera
        this.OrbitControl.target.lerp(this.cameraTarget, lerpFactor);

        // Compute new camera position based on model rotation
        const cameraOffset = new THREE.Vector3(0, 3, -5);
        cameraOffset.applyQuaternion(this.model.quaternion);

        // Calcule a posição desejada da câmera
        const desiredPosition = this.model.position.clone().add(cameraOffset);

        // Se houver movimentação, interpole suavemente a posição da câmera
        if (isMoving) {
            this.camera.position.lerp(desiredPosition, lerpFactor);
        }

        // Faça a câmera olhar suavemente para o personagem
        this.camera.lookAt(this.model.position);
    }

    directionOffset(keysPressed) {
        var directionOffset = 0 // w

        if (keysPressed[W] || keysPressed[UP]) {
            if (keysPressed[A] || keysPressed[LEFT]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D] || keysPressed[RIGHT]) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed[S] || keysPressed[DOWN]) {
            if (keysPressed[A] || keysPressed[LEFT]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D] || keysPressed[RIGHT]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A] || keysPressed[LEFT]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D] || keysPressed[RIGHT]) {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset
    }
}