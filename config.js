const LightSource = require("./LightSource.js");

module.exports = {
    filePath:"./meshes/geometryScene.obj",
    outputPath:"./output.png",
    availibleThreads:20,
    renderRes:[200,170],
    renderIterations:7,
    colorDecayRate:1, // decay mode of color weights     0: none, 1: linear, 2+: exponential
    toneMapping: {
        activationLevel:180,
        strength: 2
    },
    lightSources: [
        new LightSource({x:0,y:4,z:-8},30),
        new LightSource({x:13,y:6,z:-4},30),
        new LightSource({x:-13,y:6,z:-4},30),
        new LightSource({x:0,y:3,z:-15},30),
        new LightSource({x:0,y:0,z:-13},30),
    ]
}