const fs = require('fs');
const path = require('path');
const config = require("./config.js");

module.exports.verifyPath = () => {
    const splitPath = config.filePath.split('.');
    if(splitPath[splitPath.length-1] !== "obj") {
        console.log("\x1b[41mError: this program currently only supports .obj files.\x1b[0m");
        console.log("\x1b[31mYou can use other tools to convert this model to a .obj\x1b[0m\u001B[?25h");
        return false;
    }
    return true;
}

module.exports.import = (filePath) => {
    const file = fs.readFileSync(filePath, (e) => {
        if(e) console.error("error reading input file: "+e)
    }).toString('utf8');
    const parsed = parseOBJ(file,filePath);
    return parsed;
}

const parseOBJ = (text, filePath) => {
    const lines = text.split('\n');
    let parsed = [];
    let verts = [], norms = [], uvs = [];
    let matFile, matName;
    let ob = 0;
    const dirName = path.resolve(filePath, "..");
    for(let i=0;i<lines.length;i++) {
        const split = lines[i].split(' ');
        if(split[0] == "v") {
            split.splice(0,1);
            verts.push(split.map(e=>Number(e)));
        } else if(split[0] == "vt") {
            split.splice(0,1);
            uvs.push(split.map(e=>Number(e)));
        } else if(split[0] == "vn") {
            split.splice(0,1);
            norms.push(split.map(e=>Number(e)));
        } else if(split[0] == "o") {ob=split[1];/*verts = []; norms = []; uvs = [];*/}
        else if(split[0] == "f") {
            split.splice(0,1);
            const allTriangles = faceToTris(split);
            for(let i=0;i<allTriangles.length;i++) {
                parsed.push(combineProps(allTriangles[i], verts, norms, uvs, matName, matFile, ob));
            }
        }
        else if(split[0] == "usemtl") matName = split[1]
        else if(split [0] == "mtllib") matFile = fs.readFileSync(path.join(dirName, split[1]), 'utf-8', (err)=>{if(err)console.error(err)})
    }
    return parsed;
}

const combineProps = (tri, verts, norms, uvs, mat, matFile, ob) => {
    return {
        ob:ob,
        material:extractMaterialProps(mat, matFile),
        verts: [
            {x: verts[tri[0].v-1][0], y:verts[tri[0].v-1][1], z:verts[tri[0].v-1][2]},
            {x: verts[tri[1].v-1][0], y:verts[tri[1].v-1][1], z:verts[tri[1].v-1][2]},
            {x: verts[tri[2].v-1][0], y:verts[tri[2].v-1][1], z:verts[tri[2].v-1][2]},
        ],
        uvCoords: [
            {x: uvs[tri[0].vt-1][0], y:uvs[tri[0].vt-1][1]},
            {x: uvs[tri[1].vt-1][0], y:uvs[tri[1].vt-1][1]},
            {x: uvs[tri[2].vt-1][0], y:uvs[tri[2].vt-1][1]},
        ],
        normals: [
            {x: norms[tri[0].vn-1][0], y:norms[tri[0].vn-1][1], z:norms[tri[0].vn-1][2]},
            {x: norms[tri[1].vn-1][0], y:norms[tri[1].vn-1][1], z:norms[tri[1].vn-1][2]},
            {x: norms[tri[2].vn-1][0], y:norms[tri[2].vn-1][1], z:norms[tri[2].vn-1][2]},
        ],
    }
}

const extractMaterialProps = (matName, matFile) => {
    let split = matFile.split("\n");
    let parsedMaterial = {};
    const startI = split.indexOf("newmtl "+matName);
    for(let i=startI+1;i<split.length;i++) {
        const thisLine = split[i].split(" ");
        if(thisLine[0] == "newmtl") break
        else if(thisLine[0] == "Ns") parsedMaterial.metalic = Number(thisLine[1])
        else if(thisLine[0] == "Ka") parsedMaterial.ambient = [Number(thisLine[1]), Number(thisLine[2]), Number(thisLine[3])]
        else if(thisLine[0] == "Kd") parsedMaterial.diffuse = [Number(thisLine[1]), Number(thisLine[2]), Number(thisLine[3])]
        else if(thisLine[0] == "Ks") parsedMaterial.specular = [Number(thisLine[1]), Number(thisLine[2]), Number(thisLine[3])]
        else if(thisLine[0] == "d") parsedMaterial.alpha = Number(thisLine[1])
    }
    return parsedMaterial;
}

const faceToTris = (vertData) => {
    let triangles = [];
    for(let i=0;i<vertData.length-1;i+=1) {
        const p0 = vertData[i+0].split('/');
        const p1 = vertData[i+1].split('/');
        const p2 = i==0?vertData[2].split('/'):vertData[0].split('/');
        triangles.push([
            {v:Number(p0[0]),vt:Number(p0[1]),vn:Number(p0[2])},
            {v:Number(p1[0]),vt:Number(p1[1]),vn:Number(p1[2])},
            {v:Number(p2[0]),vt:Number(p2[1]),vn:Number(p2[2])}
        ])
        if(i==0) i++;
    }
    return triangles;
}