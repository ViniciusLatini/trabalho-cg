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
    gravity = -30; // Força da gravidade

    constructor(camera, controls, heightMatrix) {
        this.currentAction = '';
        this.camera = camera;
        this.controls = controls; // PointerLockControls instance
        this.heightMatrix = heightMatrix;
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 15; // Velocidade inicial do pulo
        }
    }

    update(delta, keysPressed) {
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true);

        if (directionPressed) {
            this.currentAction = 'walking';
        } else {
            this.currentAction = 'stopped';
        }

        // Calculate movement direction based on character's current rotation
        const forwardVector = new THREE.Vector3(0, 0, -1); // Forward vector in local space (Z negativo para frente)
        forwardVector.applyQuaternion(this.camera.quaternion); // Transform to world space
        forwardVector.normalize();

        const rightVector = new THREE.Vector3(1, 0, 0); // Right vector in local space
        rightVector.applyQuaternion(this.camera.quaternion);
        rightVector.normalize();

        if (this.currentAction == 'walking') {
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

        // Apply gravity and handle jumping
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
            // Atualiza a velocidade do pulo de acordo com a gravidade
            this.jumpVelocity += this.gravity * delta;
            this.camera.position.y += this.jumpVelocity * delta;

            // Verifica se o personagem atingiu o chão
            const currentXMap = Math.round(this.camera.position.x) + 100;
            const currentZMap = Math.round(this.camera.position.z) + 100;
            const groundHeight = this.heightMatrix[currentXMap][currentZMap] + 2.5;

            if (this.camera.position.y <= groundHeight) {
                this.camera.position.y = groundHeight; // Coloca o personagem no chão
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        } else {
            const currentXMap = Math.round(this.camera.position.x) + 100;
            const currentZMap = Math.round(this.camera.position.z) + 100;
            const groundHeight = this.heightMatrix[currentXMap][currentZMap] + 2.5;

            if (this.camera.position.y > groundHeight) {
                // Aplica a gravidade ao personagem
                this.jumpVelocity += this.gravity * delta;
                this.camera.position.y += this.jumpVelocity * delta;

                if (this.camera.position.y <= groundHeight) {
                    this.camera.position.y = groundHeight; // Coloca o personagem no chão
                    this.jumpVelocity = 0;
                }
            }
        }
    }
}