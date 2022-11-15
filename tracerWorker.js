const colition = require('./colition.js');
const camera = require("./camera");
const render = require("./render.js");
const vector = require("./vector.js");
const shader = require("./shader.js");
const { Worker, isMainThread, parentPort, workerData  } = require('worker_threads');

let iteration, mesh, lightSources,progress=0;
let lastUpdate = new Date().getTime();

const thread = (data) => {
    iteration = data.currentIteration;
    mesh = data.mesh;
    lightSources = data.lightSources;
    let lastReport = 0;
    for(let i=0;i<data.rays.length;i+=1) {
        rayIteration(data.rays[i], data.lastIteration);
        if(new Date().getTime() - lastUpdate > 1000) {
            parentPort.postMessage({finished:false,progress:i/workerData.rays.length, id:workerData.threadI});
            lastReport = i;
        }
    }
    parentPort.postMessage({finished:true,progress:1,rays:data.rays, startI:data.startIndex, id:workerData.threadI});
    process.exit();     
};


const rayIteration = (ray, lastIteration) => {
    let closestIntersection = undefined, closestIntersectingTriI, closestIntersectionnDist = Infinity;
    for(let i=0;i<mesh.length;i++) {
        const thisTri = mesh[i].verts;
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
        const triNormals = mesh[closestIntersectingTriI].normals;
        let newHeading = colition.reflectOffNormal(ray.heading, vector.normalize(vector.div(vector.add(triNormals[0], vector.add(triNormals[1], triNormals[2])),3)));
        ray.heading = newHeading;
        ray.emanation = vector.add(closestIntersection,vector.mult(newHeading,0.03));

        const shadedPixel = shader(ray, mesh, closestIntersectingTriI, iteration, lightSources);
        ray.shadedHit = shadedPixel;

        if(mesh[closestIntersectingTriI].material.alpha < 0.97) {
            ray.heading = ray.hitStack[ray.hitStack.length-1].ray.heading;
            ray.emanation = vector.add(closestIntersection,vector.mult(ray.heading,0.07));
        }
    } else {
        ray.missed = true;
    }
}

thread(workerData);