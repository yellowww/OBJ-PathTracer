const LightSource = require("./LightSource.js");

module.exports = {
    filePath:"./meshes/carModel2.obj", // path to 3d model
    outputPath:"./output.png", // path to render output
    availibleThreads:20, // available threads this program can use. Don't set this higher than your CPU thread count (it won't have any positive affect on render times)
    renderRes:[1280,720], // resolution of the final render
    renderIterations:7, // total render iterations (light bounces) keep this greater or equal to 2
    colorDecayRate:1, // decay mode of color weights (0: none, 1: linear, 2+: exponential)
    toneMapping: {
        activationLevel:180, // minimum threshold to activate tonemaping function (0-255)
        strength: 2 // strength of the tonemapping function (higer = quicker falloff)
    },
    lightSources: [ // light sources in your scene (position {x,y,z}, intensity)
        new LightSource({x:0,y:4,z:-8},30),
        new LightSource({x:13,y:6,z:-4},30),
        new LightSource({x:-13,y:6,z:-4},30),
        new LightSource({x:0,y:3,z:-15},30),
        new LightSource({x:0,y:0,z:-13},30),
    ]
}
