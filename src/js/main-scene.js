document.addEventListener('DOMContentLoaded', initScene, false);
var scale = 10;
var amount = 7;
function initScene() {
    if (!BABYLON.Engine.isSupported()) {
        return;
    }
    var canvas = document.getElementById("renderCanvas");
    var engine = new BABYLON.Engine(canvas, true);
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(.3, .3, .3);
    var camera = attachCamera(canvas, scene, scale);
    var light = setLight(scene);
    createPatternSpaceBox(scene, scale);
    var cortex = new Cortex(amount, scene, scale, camera, engine);
    engine.runRenderLoop(function () { return scene.render(); });
    cortex.draw();
    bindControls(cortex);
}
function attachCamera(canvas, scene, scale) {
    var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 12, 0, scale, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setPosition(new BABYLON.Vector3(0, scale / 3, -2.5 * scale));
    var betaLimit = (Math.PI / 2) * 0.99;
    camera.lowerBetaLimit = 1 / scale;
    camera.upperBetaLimit = 2 * betaLimit;
    camera.lowerRadiusLimit = scale / 2;
    camera.alpha = 5.5;
    camera.attachControl(canvas, false);
    return camera;
}
function setLight(scene) {
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = .8;
    var lamp = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 50, 50), scene);
    lamp.intensity = .4;
    lamp.diffuse = new BABYLON.Color3(0, .1, .1);
    lamp.specular = new BABYLON.Color3(0, 0, .1);
    return lamp;
}
function createPatternSpaceBox(scene, scale) {
    var borderBox = BABYLON.Mesh.CreateBox("borders", scale, scene);
    borderBox.position = new BABYLON.Vector3(0, 0, 0);
    var borderBoxMaterial = new BABYLON.StandardMaterial("wire", scene);
    borderBoxMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
    borderBoxMaterial.wireframe = true;
    borderBoxMaterial.alpha = 0.5;
    borderBox.material = borderBoxMaterial;
    return borderBox;
}
function createMediator(scene) {
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 2, 2, scene);
    sphere.position.y = 1;
    return sphere;
}
