const camera = require("./camera.js");
const colition = require("./colition.js");

module.exports = (ray, mesh, closestIntersectingTriI, iteration, lightSources) => {
    const diffuse = mesh[closestIntersectingTriI].material.diffuse;
    const rgb = [diffuse[0]*255, diffuse[1]*255, diffuse[2]*255];
    for(let i=0;i<rgb.length;i++) if(rgb[i] < 1) rgb[i] = 1;

    const thisHit = ray.hitStack[ray.hitStack.length - 1];
    const lastHit = ray.hitStack[ray.hitStack.length - 2];
    const thisMaterial = mesh[thisHit.triIndex].material;
    let lastMaterial;
    if(iteration>=2) lastMaterial = mesh[lastHit.triIndex].material;

    const illuminationDecayRate = Math.pow(thisMaterial.metalic, 0.85)*1.65;
    const illumination = applyFalloff(getIllumination(mesh, ray, lightSources), illuminationDecayRate/3)*160;
    
    let weight = 0.25;
    ray.hitStack[ray.hitStack.length - 1].test = mesh[closestIntersectingTriI].ob;
    ray.hitStack[ray.hitStack.length - 1].i = iteration;
    if(iteration >= 2) {
        let metalic = lastMaterial.metalic;
        if(metalic < 1) metalic = 1;      
        weight = metalic/1000;   
        weight *= lastHit.weight;   
        thisHit.weight = weight;
    } else thisHit.weight = 1;

    thisHit.weight *= thisMaterial.alpha>0.97?1:(1-thisMaterial.alpha);
    weight *= thisMaterial.alpha;

    return {color:rgb,illumination:(illumination/10), weight:weight};
}

const applyFalloff = (illumination, falloffRate) => {
    const fd = ((falloffRate**1.61)/950) + 1;
    const e = 1 + (falloffRate/300);
    return (illumination/fd)**e;
}

const getIllumination = (mesh, ray, lightSources) => {
    let illumination = 0;
    if(ray.hitStack.length == 0) return 0;
    if(lightSources == undefined) lightSources = camera.lightSources;
    for(let i=0;i<lightSources.length;i++) {
        const thisLight = lightSources[i];
        const lastHit = ray.hitStack[ray.hitStack.length-1];
        const distanceToLight = colition.distanceToLine(lastHit.ray, thisLight.position);
        if(colition.backFaceCulling(mesh,lastHit.triIndex,thisLight,lastHit.hit)) illumination += thisLight.intensity / distanceToLight;
        
    }
    return illumination;
}