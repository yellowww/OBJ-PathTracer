const rayTriIntersect = require('watertight-ray-triangle-intersection');
const vector = require("./vector.js");
const ray = require("./Ray.js");
const camera = require("./camera.js");

module.exports = {
    checkSphereIntersection:(ray, tri) => {
        const spherePos = vector.div(vector.add(tri[0], vector.add(tri[1], tri[2])),3);
        let d = [];
        for(let i=0;i<3;i++) d.push(vector.dist(tri[i], spherePos));
        const rad = Math.max(...d);
        const oc = vector.sub(ray.emanation, spherePos);
        const a = vector.dot(ray.heading, ray.heading);
        const b = 2*vector.dot(oc, ray.heading);
        const c = vector.dot(oc, oc) - rad**2;
        const discriminant = b**2 - 4*a*c;
        return discriminant > 0;
    },
    simpleDirectionCheck:(ray, vert) => {
        const nVert = vector.add(vert, camera.position);
        if(nVert.x>0 && ray.heading.x<=0) return true;
        else if(nVert.x<0 && ray.heading.x>=0) return true;

        if(nVert.y>0 && ray.heading.y<=0) return true;
        else if(nVert.y<0 && ray.heading.y>=0) return true;

        if(nVert.z>0 && ray.heading.z<=0) return true;
        else if(nVert.z<0 && ray.heading.z>=0) return true;

        return false;
    },
    checkDirection:(ray, tri) => {
        const v0 = module.exports.simpleDirectionCheck(ray, tri[0]);
        const v1 = module.exports.simpleDirectionCheck(ray, tri[1]);
        const v2 = module.exports.simpleDirectionCheck(ray, tri[2]);

        return !(v0 && v1 && v2);
    },
    checkIntersection:(_ray,_tri,cull) => {
        if(!module.exports.checkSphereIntersection(_ray,_tri)) return [];
        let ray, tri, reversed;
        if(cull) {
            reversed = module.exports.createPositive(_ray, _tri);
            ray = reversed.ray;
            tri = reversed.tri;
        } else {ray=_ray;tri=_tri;}
        let flatTri = [];
        for(let i=0;i<tri.length;i++) flatTri.push([tri[i].x,tri[i].y,tri[i].z]);
        let intersection = [];
        rayTriIntersect(intersection, [ray.emanation.x, ray.emanation.y, ray.emanation.z], [ray.heading.x, ray.heading.y, ray.heading.z], flatTri);
        if(cull) intersection = module.exports.reverseIntersection(reversed.reversed,intersection);
        if(cull) {
            if(!module.exports.checkForInvalidHit(intersection, _ray.emanation, _ray.heading)) return [];
        }
        return intersection;
    },
    reverseIntersection:(reversed, intersection) => {
        if(reversed.x) intersection[0]*=-1;
        if(reversed.y) intersection[1]*=-1;
        if(reversed.z) intersection[2]*=-1;
        return intersection;
    },
    createPositive:(_ray, _tri) => {
        let ray = JSON.parse(JSON.stringify(_ray));
        let tri = JSON.parse(JSON.stringify(_tri));
        let reversed = {x:false,y:false,z:false};
        if(ray.heading.x < 0) {
            ray.heading.x*=-1;
            ray.emanation.x*=-1;
            tri[0].x*=-1;
            tri[1].x*=-1;
            tri[2].x*=-1;
            reversed.x = true;
        }
        if(ray.heading.y < 0) {
            ray.heading.y*=-1;
            ray.emanation.y*=-1;
            tri[0].y*=-1;
            tri[1].y*=-1;
            tri[2].y*=-1;
            reversed.y = true;
        }
        if(ray.heading.z < 0) {
            ray.heading.z*=-1;
            ray.emanation.z*=-1;
            tri[0].z*=-1;
            tri[1].z*=-1;
            tri[2].z*=-1;
            reversed.z = true;
        }
        return {reversed:reversed, tri:tri, ray:ray};
    },
    checkForInvalidHit:(hit, emanation, heading) => {
        if(heading.x>0) {
            if (hit[0]<emanation.x) return false;
        } else if (heading.x < 0) {
            if (hit[0]>emanation.x) return false;
        } else if (heading.x) {
            if (hit[0]!=emanation.x) return false;
        }
        if(heading.y>0) {
            if (hit[1]<emanation.y) return false;
        } else if (heading.y < 0) {
            if (hit[1]>emanation.y) return false;
        } else if (heading.y) {
            if (hit[1]!=emanation.y) return false;
        }
        if(heading.z>0) {
            if (hit[2]<emanation.z) return false;
        } else if (heading.z < 0) {
            if (hit[2]>emanation.z) return false;
        } else if (heading.z) {
            if (hit[2]!=emanation.z) return false;
        }
        return true;
    },
    reflectOffNormal: (ray, normal) => {
       const dotProd = vector.dot(ray, normal);
       const scaled = vector.mult(normal, dotProd*2);
       return vector.sub(ray, scaled);
    },
    distanceToLine:(ray, point, log) => {
        return module.exports.distanceToLinePoints(point.x, point.y, point.z,
                                            ray.emanation.x, ray.emanation.y, ray.emanation.z,
                                            ray.emanation.x + ray.heading.x*1000, ray.emanation.y + ray.heading.y*1000, ray.emanation.z + ray.heading.z*1000);
    },
    distanceToLinePoints: ( x1,  y1,  z1, x2,  y2,  z2, x3,  y3,  z3) => {
        const b = Math.sqrt(Math.pow((x2 - x3), 2) 
        + Math.pow((y2 - y3), 2) 
        + Math.pow((z2 - z3), 2));

        const S = Math.sqrt(Math.pow((y2 - y1) * (z3 - z1) - (z2 - z1) * (y3 - y1), 2) +
        Math.pow((z2 - z1) * (x3 - x1) - (x2 - x1) * (z3 - z1), 2) +
        Math.pow((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1), 2)) / 2;

        return 2 * S / b;
    },
    backFaceCulling:(mesh,excludeIndex, lightSource, intersectionPoint) => {
        const rayToIntersection = new ray.Ray(
            lightSource.position,
            vector.normalize(vector.sub(intersectionPoint, lightSource.position)),
            undefined,
            undefined
        );
        let distanceToTri = Infinity, closestDistance = Infinity;
        for(let i=0;i<mesh.length;i++) {
            if(mesh[i].material.alpha >= 0.97) {
                const thisTri = mesh[i].verts;
                const thisIntersection = module.exports.checkIntersection(rayToIntersection, thisTri, false);
                if(thisIntersection.length > 0) {
                    const distanceToIntersection = vector.dist(lightSource.position, {x:thisIntersection[0],y:thisIntersection[1],z:thisIntersection[2]});
                    if(i==excludeIndex) {distanceToTri = distanceToIntersection}
                    else if(distanceToIntersection<closestDistance) {closestDistance = distanceToIntersection};
                }                
            }
        }
        return distanceToTri < closestDistance;
    }
}
