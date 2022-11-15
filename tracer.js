const { Worker, isMainThread } = require('worker_threads');

const colition = require('./colition.js');
const camera = require("./camera");
const render = require("./render.js");
const vector = require("./vector.js");
const shader = require("./shader.js");
const status = require("./status.js");

module.exports.mesh = undefined;
module.exports.startTime = undefined;

let iteration = 0;

const rayIteration = (ray, lastIteration, log) => {
    let closestIntersection = undefined, closestIntersectingTriI, closestIntersectionnDist = Infinity;
    for(let i=0;i<module.exports.mesh.length;i++) {
        const thisTri = module.exports.mesh[i].verts;
        const thisIntersection = colition.checkIntersection(ray, thisTri, true);
        
        if(thisIntersection.length > 0) {
            const dist = vector.dist({x:thisIntersection[0],y:thisIntersection[1],z:thisIntersection[2]}, ray.emanation)
            if(dist < closestIntersectionnDist) {
                closestIntersectionnDist = dist; 
                closestIntersection = {x:thisIntersection[0],y:thisIntersection[1],z:thisIntersection[2]};
                closestIntersectingTriI = i;
            };
        }
    }
    //if(iteration == 10 && log) console.log(ray.emanation, ray.heading, module.exports.mesh[closestIntersectingTriI].verts);
    if(closestIntersection !== undefined && !lastIteration) {
        ray.hitStack.push({
            ray:{
                emanation:ray.emanation,
                heading:ray.heading
            },
            head:ray.heading,
            hit:closestIntersection,
            rayId:ray.pxOrigin,
            triIndex:closestIntersectingTriI
        });
        const triNormals = module.exports.mesh[closestIntersectingTriI].normals;
        let newHeading = colition.reflectOffNormal(ray.heading, vector.normalize(vector.div(vector.add(triNormals[0], vector.add(triNormals[1], triNormals[2])),3)));
        ray.heading = newHeading;
        ray.emanation = vector.add(closestIntersection,vector.mult(newHeading,0.03));
        
        render.pixelMap[ray.pxOrigin.x][ray.pxOrigin.y].colors.push(shader(ray, module.exports.mesh, closestIntersectingTriI, iteration));

        if(module.exports.mesh[closestIntersectingTriI].material.alpha < 0.97) {
            ray.heading = ray.hitStack[ray.hitStack.length-1].ray.heading;
            ray.emanation = vector.add(closestIntersection,vector.mult(ray.heading,0.07));
        }
    } else {
        ray.missed = true;
        //let i = Math.round((getIllumination(ray,lastIteration,0)*2)**2.3);
        //render.pixelMap[ray.pxOrigin.x][ray.pxOrigin.y].intensity = i;
    }
}



const traceAllRays = (lastIteration) => {
    iteration++;
    console.log("tracing iteration "+iteration);
    for(let i=0;i<camera.rays.length;i++) {
        rayIteration(camera.rays[i], lastIteration, i == 0);
        if(i%10000 == 0) console.log(`${Math.round(i/camera.rays.length*100)}% done`);
    }
    destroyMissedRays();
    console.log(camera.rays.length);
}

const traceRaysMultithreaded = (lastIteration, cb, threads) => {
    status.newIteration();
    iteration++;
    if(camera.rays == 0) {
        status.print(true,iteration, new Date().getTime() - module.exports.startTime, 0, [], 0, "finished");
        cb(iteration);
        return;
    }
    if(threads == undefined) threads = 20;
    const startingRays = camera.rays.length;
    status.print(true,iteration, new Date().getTime() - module.exports.startTime, 0, new Array(threads).fill(0), startingRays, "starting threads...");
    let finishedWorkers = 0;
    let threadProgress = [];
    let statusInterval;
    let firstStatusUpdate = true;
    const startDate = new Date().getTime();
    
    for(let i=0;i<threads;i++) {
        const startIndex = Math.floor(i * (camera.rays.length / threads));
        const endIndex = Math.floor((i+1) * (camera.rays.length / threads));
        const thisWorker = new Worker("./tracerWorker.js", {workerData:{startIndex:startIndex, lastIteration:lastIteration, currentIteration:iteration, mesh:module.exports.mesh, rays:camera.rays.slice(startIndex,endIndex), threadI:i, res:{x:render.pixelMap.length, y:render.pixelMap[0].length}, lightSources:camera.lightSources}});
        threadProgress.push(0);
        thisWorker.on("message", (result) => {
            if(result.finished) {
                for(let i=0;i<result.rays.length;i++) camera.rays[i+result.startI] = result.rays[i];
                firstStatusUpdate = true;
                status.print(true,iteration, new Date().getTime() - module.exports.startTime, new Date().getTime() - startDate, threadProgress, startingRays, `merging thread ${finishedWorkers}...`);
                mergePixelMaps(result.rays);
                finishedWorkers++
                if(finishedWorkers == threads) {
                    for(let i=0;i<threadProgress.length;i++) threadProgress[i]=1;
                    destroyMissedRays();
                    clearInterval(statusInterval);
                    status.print(true,iteration, new Date().getTime() - module.exports.startTime, new Date().getTime() - startDate, threadProgress, startingRays, "\x1b[32mfinished\x1b[0m");
                    cb(iteration);
                }                
            } else {
                threadProgress[result.id] = result.progress;
            }
        });
    }
    statusInterval = setInterval(() => {
        status.print(firstStatusUpdate,iteration, new Date().getTime() - module.exports.startTime, new Date().getTime() - startDate, threadProgress, startingRays);
        if(firstStatusUpdate) firstStatusUpdate = false;
    },500);
}

const mergePixelMaps = (rays) => {
    for(let i=0;i<rays.length;i++) {
        const ray = rays[i];
        if(!ray.missed) render.pixelMap[ray.pxOrigin.x][ray.pxOrigin.y].colors.push(ray.shadedHit);
    }
}

const destroyMissedRays = () => {
    const newRays = [];
    for(let i=0;i<camera.rays.length;i++) {
        if(!camera.rays[i].missed) {
            newRays.push(camera.rays[i]);
        }
    }
    camera.rays = newRays;
}

module.exports.traceFrame = traceAllRays;
module.exports.traceFrameMultiThreaded = traceRaysMultithreaded;