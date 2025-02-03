import * as THREE from 'three';

export const W = 'w';
export const A = 'a';
export const S = 's';
export const D = 'd';
export const UP = 'arrowup';
export const LEFT = 'arrowleft';
export const RIGHT = 'arrowright';
export const DOWN = 'arrowdown';
export const DIRECTIONS = [W, A, S, D, UP, LEFT, RIGHT, DOWN];

export class CharacterController {
    animationsMap = new Map();
    // Moving data
    walkDirection = new THREE.Vector3();
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuarternion = new THREE.Quaternion();
    cameraTarget = new THREE.Vector3();
    // Moving constants
    fade = 0.2;
    walkVelocity = 10;
    rotationSpeed = 0.05; // Velocidade de rotação do personagem
    cameraVerticalAngle = 0; // Ângulo vertical da câmera
    heightMatrix = null

    constructor(model, mixer, animationsMap, camera, controls, heightMatrix) {
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.currentAction = '';
        this.camera = camera;
        this.controls = controls; // PointerLockControls instance
        this.heightMatrix = heightMatrix;
        this.updateCamera(); // Initialize camera position
    }

    jump() {
        let alpha = 0.01;
        let characterY = this.model.position.y;
        let jumpHeight = 50;
        this.model.position.y = THREE.MathUtils.lerp(characterY, characterY + jumpHeight, alpha);
        this.updateCamera();
    }

    update(delta, keysPressed) {
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true);

        var play = 'Armature.001|Walk_Armature_0';
        const toPlay = this.animationsMap.get(play);
        if (directionPressed) {
            toPlay.play();
            this.currentAction = 'walking';
        } else {
            toPlay.stop();
            this.currentAction = 'stopped';
        }
        this.mixer.update(delta);

        if (this.currentAction == 'walking') {
            // Rotate character based on A/D or ArrowLeft/ArrowRight keys
            if (keysPressed[A] || keysPressed[LEFT]) {
                this.rotateCharacter(this.rotationSpeed, false); // Rotate left
            }
            if (keysPressed[D] || keysPressed[RIGHT]) {
                this.rotateCharacter(-this.rotationSpeed, false); // Rotate right
            }

            // Move character forward/backward based on W/S or ArrowUp/ArrowDown keys
            if (keysPressed[W] || keysPressed[UP]) {
                this.moveCharacter(delta, 1); // Move forward
            }
            if (keysPressed[S] || keysPressed[DOWN]) {
                this.moveCharacter(delta, -1); // Move backward
            }

            // Update camera position to follow the character
            this.updateCamera();
        }
    }

    rotateCharacter(angle, isMouseRotation) {
        // Rotate the character around the Y-axis
        this.model.rotateY(angle);

        // Ativar animação de rotação se for uma rotação por mouse
        if (isMouseRotation) {
            const play = 'Armature.001|Walk_Armature_0'; // Nome da animação de rotação
            const toPlay = this.animationsMap.get(play);
            toPlay.play();
            this.currentAction = 'walking';
        }

        // Update camera position to follow the character's rotation
        this.updateCamera();
    }

    rotateCameraVertical(angle) {
        // Atualiza o ângulo vertical da câmera
        this.cameraVerticalAngle += angle;

        // Limita o ângulo vertical para evitar rotações extremas
        this.cameraVerticalAngle = Math.max(-Math.PI / 4, Math.min(Math.PI / 3, this.cameraVerticalAngle));

        // Atualiza a posição da câmera
        this.updateCamera();
    }

    moveCharacter(delta, direction) {
        // Calculate movement direction based on character's current rotation
        const forwardVector = new THREE.Vector3(0, 0, 1); // Forward vector in local space (Z positivo para frente)
        forwardVector.applyQuaternion(this.model.quaternion); // Transform to world space

        // Normalize the direction and apply velocity
        forwardVector.normalize();
        forwardVector.multiplyScalar(this.walkVelocity * delta * direction);

        // Calculate the next position in the map
        const { x, y, z } = this.model.position.clone().add(forwardVector);
        const nextXMap = Math.round(x) + 100;
        const nextZMap = Math.round(z) + 100;
        const currentXMap = Math.round(this.model.position.x) + 100;
        const currentZMap = Math.round(this.model.position.z) + 100;
        if (this.heightMatrix[nextXMap][nextZMap] < y - 1) {
            console.log('entrou');
            console.log('y: ', y);
            console.log('heightMatrix: ', this.heightMatrix[nextXMap][nextZMap]);
            forwardVector.y = this.heightMatrix[nextXMap][nextZMap] - this.heightMatrix[currentXMap][currentZMap];
            // Update character position
            this.model.position.add(forwardVector);
        }

        // Update camera position to follow the character
        this.updateCamera();
    }

    updateCamera() {
        // Define a fixed offset for the camera
        const cameraOffset = new THREE.Vector3(0, 3, -5); // Ajuste o offset da câmera
        cameraOffset.applyQuaternion(this.model.quaternion); // Aplica a rotação do personagem ao offset

        // Aplica a rotação vertical da câmera
        const verticalRotation = new THREE.Quaternion();
        verticalRotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.cameraVerticalAngle);
        cameraOffset.applyQuaternion(verticalRotation);

        // Calculate the desired camera position
        const desiredPosition = this.model.position.clone().add(cameraOffset);

        // Set the camera position directly
        this.camera.position.copy(desiredPosition);

        // Make the camera look at the character
        this.camera.lookAt(this.model.position);
    }

    directionOffset(keysPressed) {
        var directionOffset = 0; // w

        if (keysPressed[W] || keysPressed[UP]) {
            if (keysPressed[A] || keysPressed[LEFT]) {
                directionOffset = Math.PI / 4; // w+a
            } else if (keysPressed[D] || keysPressed[RIGHT]) {
                directionOffset = -Math.PI / 4; // w+d
            }
        } else if (keysPressed[S] || keysPressed[DOWN]) {
            if (keysPressed[A] || keysPressed[LEFT]) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
            } else if (keysPressed[D] || keysPressed[RIGHT]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
            } else {
                directionOffset = Math.PI; // s
            }
        } else if (keysPressed[A] || keysPressed[LEFT]) {
            directionOffset = Math.PI / 2; // a
        } else if (keysPressed[D] || keysPressed[RIGHT]) {
            directionOffset = -Math.PI / 2; // d
        }

        return directionOffset;
    }
}