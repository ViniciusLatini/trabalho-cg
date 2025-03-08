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

    walkDirection = new THREE.Vector3();
    walkVelocity = 10;
    heightMatrix = null;

    isJumping = false;
    jumpVelocity = 0;
    gravity = -30;

    constructor(camera, controls, heightMatrix) {
        this.currentAction = '';
        this.camera = camera;
        this.controls = controls;
        this.heightMatrix = heightMatrix;
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 15;
        }
    }

    update(delta, keysPressed) {
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] === true);
        this.currentAction = directionPressed ? 'walking' : 'stopped';

        // Ajuste para garantir que o vetor de movimentação não seja afetado pela inclinação da câmera
        const forwardVector = new THREE.Vector3(0, 0, -1);
        forwardVector.applyQuaternion(this.camera.quaternion);
        forwardVector.y = 0; // Mantém a movimentação apenas no plano XZ
        forwardVector.normalize();

        const rightVector = new THREE.Vector3(1, 0, 0);
        rightVector.applyQuaternion(this.camera.quaternion);
        rightVector.y = 0;
        rightVector.normalize();

        if (this.currentAction === 'walking') {
            if (keysPressed[W] || keysPressed[UP]) {
                this.moveWithCollision(forwardVector, delta);
            }
            if (keysPressed[S] || keysPressed[DOWN]) {
                this.moveWithCollision(forwardVector.clone().negate(), delta);
            }
            if (keysPressed[A] || keysPressed[LEFT]) {
                this.moveWithCollision(rightVector.clone().negate(), delta);
            }
            if (keysPressed[D] || keysPressed[RIGHT]) {
                this.moveWithCollision(rightVector, delta);
            }
        }

        this.applyGravity(delta);
    }

    moveWithCollision(direction, delta) {
        direction.multiplyScalar(this.walkVelocity * delta);
        const { x, y, z } = this.camera.position.clone().add(direction);
        const nextXMap = Math.round(x) + 100;
        const nextZMap = Math.round(z) + 100;

        if (this.heightMatrix[nextXMap][nextZMap] <= y - 2.5) {
            this.camera.position.add(direction);
        }
    }

    applyGravity(delta) {
        if (this.isJumping) {
            this.jumpVelocity += this.gravity * delta;
            this.camera.position.y += this.jumpVelocity * delta;

            const currentXMap = Math.round(this.camera.position.x) + 100;
            const currentZMap = Math.round(this.camera.position.z) + 100;
            const groundHeight = this.heightMatrix[currentXMap][currentZMap] + 2.5;

            if (this.camera.position.y <= groundHeight) {
                this.camera.position.y = groundHeight;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        } else {
            const currentXMap = Math.round(this.camera.position.x) + 100;
            const currentZMap = Math.round(this.camera.position.z) + 100;
            const groundHeight = this.heightMatrix[currentXMap][currentZMap] + 2.5;

            if (this.camera.position.y > groundHeight) {
                this.jumpVelocity += this.gravity * delta;
                this.camera.position.y += this.jumpVelocity * delta;

                if (this.camera.position.y <= groundHeight) {
                    this.camera.position.y = groundHeight;
                    this.jumpVelocity = 0;
                }
            }
        }
    }
}