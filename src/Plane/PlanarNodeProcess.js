/**
 * Generated On: 2015-10-5
 * Class: PlanarNodeProcess
 * Description: PlanarNodeProcess effectue une opération sur un Node.
 */

define('Scene/PlanarNodeProcess', ['Scene/BoundingBox', 'Renderer/Camera', 'Core/Math/MathExtented', 'Core/Commander/InterfaceCommander', 'THREE', 'Core/defaultValue'], function(BoundingBox, Camera, MathExt, InterfaceCommander, THREE, defaultValue) {


    function PlanarNodeProcess() {
        //Constructor
        this.camera = new Camera();
        //this.camera.camera3D = camera.camera3D.clone();

        this.interCommand = new InterfaceCommander();    // TODO: InterfaceCommander static class?
    }

    PlanarNodeProcess.prototype.updateCamera = function(camera) {
        this.camera = new Camera(camera.width, camera.height);
        this.camera.camera3D = camera.camera3D.clone();
    };

    /**
     * @documentation:
     * @param  {type} node  : the node to try to cull
     * @param  {type} camera: the camera used for culling
     * @return {Boolean}      the culling attempt's result
     */
    PlanarNodeProcess.prototype.isCulled = function(node, camera) {
        return !(this.frustumCullingOBB(node, camera));
    };

    PlanarNodeProcess.prototype.checkSSE = function(node, camera) {

        return camera.SSE(node) > 6.0;

    };

    PlanarNodeProcess.prototype.isVisible = function(node, camera) {
        return !this.isCulled(node, camera) && this.checkSSE(node, camera);
    };

    PlanarNodeProcess.prototype.traverseChildren = function(node) {
        return !node.material.visible;
    };

    PlanarNodeProcess.prototype.createCommands = function(node, params) {
        var status = node.getStatus();
        for(var i = 0; i < status.length; i++) {
            this.interCommand.request(status[i], node, params.tree, {});
        }
    };

    PlanarNodeProcess.prototype.process = function(node, camera, params) {
        var updateType;
        if(node.level === 0) { // first nodes
            this.createCommands(node, params);

            node.setMaterialVisibility(false);
            if(!node.ready()) {
                node.setVisibility(false);
                return;
            } else {
                node.setVisibility(true);
            }
        } else if(!node.visible) return;

        if(node.noChild()) {
            params.tree.subdivide(node);
            node.setMaterialVisibility(true);
        } else {
            var childrenVisible = 0;
            var childrenReady = 0;
            var allChildrenCullable = true;
            for(var i = 0; i < node.children.length; i++) { // Display node if all visible children are ready to be displayed
                var child = node.children[i];

                this.createCommands(child, params);
                child.setVisibility(false);
                child.setMaterialVisibility(false);

                if(!child.cullable) { // All tiles must be tested for culling before we can reliabaly decide to display the children
                    allChildrenCullable = false;
                } else {
                    if (!this.isCulled(child,camera)) {
                        childrenVisible++;
                        if(child.ready() && this.checkSSE(child, camera)) {
                            childrenReady++;
                            child.setVisibility(true);
                            child.setMaterialVisibility(false);
                        }
                    }
                }
            }
            if(!allChildrenCullable || childrenReady !== childrenVisible || childrenVisible === 0) {  // If not all visible children are ready, display current node
                node.setMaterialVisibility(true);
            }
        }
    };

    /**
     * @documentation: Cull node with frustrum and oriented bounding box of node
     * @param {type} node
     * @param {type} camera
     * @returns {PlanarNodeProcess_L7.PlanarNodeProcess.prototype.frustumCullingOBB.node@pro;camera@call;getFrustum@call;intersectsBox}
     */

    var quaternion = new THREE.Quaternion();

    PlanarNodeProcess.prototype.frustumCullingOBB = function(node, camera) {
        this.camera = new Camera(); // meh.
        this.camera.camera3D = camera.camera3D.clone();
        //position in local space
        var position = node.OBB().worldToLocal(camera.position().clone());
        //position.z -= node.distance;
        this.camera.setPosition(position);
        // rotation in local space
        quaternion.multiplyQuaternions( node.OBB().quadInverse(), camera.camera3D.quaternion);
        this.camera.setRotation(quaternion);

        return this.camera.getFrustum().intersectsBox(node.OBB().box3D);
    };

    /**
     * @documentation: Pre-computing for the upcoming processes
     * @param  {type} camera
     */
    PlanarNodeProcess.prototype.prepare = function(camera) {

    };


    return PlanarNodeProcess;

});
