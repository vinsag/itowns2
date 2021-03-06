/**
 * Generated On: 2015-10-5
 * Class: Camera
 * Description: La camera scene, interface avec la camera du 3DEngine.
 */

/* global Float64Array*/

import * as THREE from 'three';
import Node from '../Scene/Node';

function Camera(width, height, debug) {
    // Constructor

    Node.call(this);

    this.ratio = width / height;
    this.FOV = 30;

    this.camera3D = new THREE.PerspectiveCamera(this.FOV, this.ratio);

    // /!\ WARNING Matrix JS are in Float32Array
    this.camera3D.matrixWorld.elements = new Float64Array(16);

    this.camera3D.matrixAutoUpdate = false;
    this.camera3D.rotationAutoUpdate = false;

    this.direction = new THREE.Vector3();
    this.frustum = new THREE.Frustum();
    this.viewMatrix = new THREE.Matrix4();
    this.width = width;
    this.height = height;

    this.updatePreSSE();

    this.cameraHelper = debug ? new THREE.CameraHelper(this.camera3D) : undefined;
}

Camera.prototype = Object.create(Node.prototype);

Camera.prototype.constructor = Camera;

/**
 */
Camera.prototype.position = function position() {
    return this.camera3D.position;
};

Camera.prototype.camHelper = function camHelper() {
    return this.cameraHelper;
};

Camera.prototype.updatePreSSE = function updatePreSSE() {
    this.Hypotenuse = Math.sqrt(this.width * this.width + this.height * this.height);
    var radAngle = this.FOV * Math.PI / 180;

    this.HFOV = 2.0 * Math.atan(Math.tan(radAngle * 0.5) / this.ratio); // TODO: not correct -> see new preSSE
    this.HYFOV = 2.0 * Math.atan(Math.tan(radAngle * 0.5) * this.Hypotenuse / this.width);
    this.preSSE = this.Hypotenuse * (2.0 * Math.tan(this.HYFOV * 0.5));

    /* TODO: New preSSE but problem on Windows
    var d = this.height / (2*Math.tan(radAngle/2));

    //TODO: Verify with arrow helper
    this.HFOV = 2*Math.atan((this.width/2)/d);
    this.HYFOV = 2*Math.atan((this.Hypotenuse/2)/d);

    this.preSSE = this.Hypotenuse * (2.0 * Math.tan(this.HYFOV * 0.5));
    */
};

Camera.prototype.createCamHelper = function createCamHelper() {
    this.cameraHelper = new THREE.CameraHelper(this.camera3D);

    var dir = new THREE.Vector3(0, 0, -1);
    var quaternion = new THREE.Quaternion();

    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.HFOV / 2);
    dir.applyQuaternion(quaternion);
    var origin = new THREE.Vector3();
    var length = 100000000;
    var hex = 0xffff00;

    this.arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
    this.cameraHelper.add(this.arrowHelper);
};

Camera.prototype.matrixWorldInverse = function matrixWorldInverse() {
    return this.camera3D.matrixWorldInverse;
};

Camera.prototype.resize = function resize(width, height) {
    this.width = width;
    this.height = height;
    this.ratio = width / height;

    this.updatePreSSE();

    this.camera3D.aspect = this.ratio;
    this.camera3D.updateProjectionMatrix();

    if (this.cameraHelper) {
        var dir = new THREE.Vector3(0, 0, -1);
        var quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.HFOV / 2);
        dir.applyQuaternion(quaternion);

        this.arrowHelper.setDirection(dir);
        this.cameraHelper.update();
    }
};

Camera.prototype.computeNodeSSE = function computeNodeSSE(node) {
    var boundingSphere = node.geometry.boundingSphere;
    var distance = Math.max(0.0, (this.camera3D.position.distanceTo(node.centerSphere) - boundingSphere.radius));

    // Removed because is false computation, it doesn't consider the altitude of node
    // Added small oblique weight (distance is not enough, tile orientation is needed)
    /*
    var altiW = node.bbox.top() === 10000 ? 0. : node.bbox.bottom() / 10000.;
    var dotProductW = Math.min(altiW + Math.abs(this.camera3D.getWorldDirection().dot(node.centerSphere.clone().normalize())), 1.);
    if (this.camera3D.position.length() > 6463300) dotProductW = 1;
    var SSE = Math.sqrt(dotProductW) * this.preSSE * (node.geometricError / distance);
    */

    // TODO: node.geometricError is computed using a hardcoded 18 level
    // The computation of node.geometricError is surely false
    var SSE = this.preSSE * (node.geometricError / distance);

    return SSE;
};

Camera.prototype.update = function update() {
    var vector = new THREE.Vector3(0, 0, 1);

    this.direction = vector.applyQuaternion(this.camera3D.quaternion);

    this.updateMatrixWorld();
    this.viewMatrix.multiplyMatrices(this.camera3D.projectionMatrix, this.camera3D.matrixWorldInverse);
    this.frustum.setFromMatrix(this.viewMatrix);
};

Camera.prototype.updateMatrixWorld = function updateMatrixWorld() {
    this.camera3D.updateMatrix();
    this.camera3D.updateMatrixWorld(true);
    this.camera3D.matrixWorldInverse.getInverse(this.camera3D.matrixWorld);
};

Camera.prototype.getDistanceFromOrigin = function getDistanceFromOrigin() {
    return this.camera3D.position.length();
};

Camera.prototype.setPosition = function setPosition(position) {
    this.camera3D.position.copy(position);
};

Camera.prototype.setRotation = function setRotation(rotation) {
    this.camera3D.quaternion.copy(rotation);
};

Camera.prototype.getFrustum = function getFrustum() {
    this.updateMatrixWorld();
    this.frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(this.camera3D.projectionMatrix, this.camera3D.matrixWorldInverse));

    return this.frustum;
};

Camera.prototype.getFrustumLocalSpace = function getFrustumLocalSpace(position, quaternion) {
    var m = new THREE.Matrix4();

    m.makeRotationFromQuaternion(quaternion.inverse());
    m.setPosition(position.negate().applyQuaternion(quaternion));

    var f = new THREE.Frustum();
    f.setFromMatrix(m.premultiply(this.camera3D.projectionMatrix));
    return f;
};


export default Camera;
