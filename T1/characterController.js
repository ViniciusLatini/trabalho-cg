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

    constructor(model, mixer, animationsMap, camera, controls) {
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.currentAction = '';
        this.camera = camera;
        this.controls = controls; // PointerLockControls instance
    }

    jump() {
        let alpha = 0.01;
        let characterY = this.model.position.y;
        let jumpHeight = 50;
        this.model.position.y = THREE.MathUtils.lerp(characterY, characterY + jumpHeight, alpha);
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
            // Calculate towards camera direction
            var angleYCameraDirection = Math.atan2(
                (this.model.position.x - this.camera.position.x),
                (this.model.position.z - this.camera.position.z)
            );

            // Diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed);

            // Rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

            this.camera.getWorldDirection(this.walkDirection);
            this.walkDirection.y = 0; // Ensure the character doesn't move vertically
            this.walkDirection.normalize();
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

            const moveX = this.walkDirection.x * this.walkVelocity * delta;
            const moveZ = this.walkDirection.z * this.walkVelocity * delta;
            this.model.position.x += moveX;
            this.model.position.z += moveZ;

            // Update camera position to follow the character
            this.camera.position.x += moveX;
            this.camera.position.z += moveZ;
        }
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