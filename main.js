const importer = require("./importer.js");
const camera = require("./camera.js");
const render = require("./render.js");
const tracer = require("./tracer.js");
const status = require("./status.js");
const config = require("./config.js");

process.stdout.write("\u001B[?25l\n\x1b[36mStarting pathtracer...\x1b[0m \n\n");

const validPath = importer.verifyPath()

const res = {x:config.renderRes[0],y:config.renderRes[1]}//{x:1920,y:1080}//{x:1280,y:720}//{x:910,y:512};
const totalIterations = config.renderIterations;
let currentIteration = 1;
let tris, startTime;
if(validPath) {
    process.stdout.write(`Rendering \x1b[33m${config.renderIterations} iterations\x1b[0m at \x1b[33m${config.renderRes[0]}x${config.renderRes[1]}\x1b[0m \n\n`);
    startTime = new Date().getTime();
    process.stdout.write(`Importing ${config.filePath}...\x1b[0m`);
    tris = importer.import(config.filePath);
    process.stdout.write(`\r\x1b[32mImporting ${config.filePath} - Done\x1b[0m   \x1b[33m${tris.length} triangles \x1b[0m\n\n`);
    tracer.mesh = tris;
    tracer.startTime = new Date().getTime();
    status.totalIterationCount = totalIterations;

    render.init(res);
    camera.init(res,1);

    for(let i=0;i<config.lightSources.length;i++) {
        camera.addLightSource(config.lightSources[i]);
    }
}

const doIteration = (threads) => { // multithreaded
    if(threads == undefined) {
        threads = Math.ceil(camera.rays.length*tris.length/2500000);
        if(threads > config.availibleThreads) threads = 20; 
    }
    tracer.traceFrameMultiThreaded(currentIteration >= totalIterations, (thisIteration) => {
        currentIteration = thisIteration + 1;
        if(currentIteration > totalIterations) {
            render.render();
            console.log("\n\x1b[32mFinished render in \x1b[36m"+ status.formatTime(new Date().getTime() - startTime, true) + "\x1b[0m\x1b[32m secconds\x1b[0m");
        } else {
            let threadCount = Math.ceil(camera.rays.length*tris.length/2500000);
            if(threadCount > config.availibleThreads) threadCount = 20; 
            doIteration(threadCount);
        }
    }, threads);
}

if(validPath) {
    status.init();

    doIteration();    
}




