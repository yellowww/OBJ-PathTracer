const fs = require('fs');
//const {createCanvas} = require("canvas");
const pureImage = require("pureimage");
const config = require("./config.js");
const post = require("./postProcessing.js");

let canvas, ctx;

module.exports.pixelMap;
module.exports.init = (res) => {
    module.exports.pixelMap = new Array(res.x);
    for(let i=0;i<res.x;i++) {
        module.exports.pixelMap[i] = new Array(res.y);
        for(let j=0;j<res.y;j++) module.exports.pixelMap[i][j] = ({colors:[],intensity:0});
    }

    canvas = pureImage.make(res.x, res.y);
    ctx = canvas.getContext("2d");
}

const combineColors = (colorStack, log) => {
    if(colorStack.colors.length === 0) return [0,0,0];
    let globalWeights = [];
    let totalWeight = 0;
    for(let i=colorStack.colors.length;i>=1;i--) totalWeight+=( ((i)) **config.colorDecayRate )*colorStack.colors[colorStack.colors.length-i].weight;
    for(let i=colorStack.colors.length;i>=1;i--) globalWeights.push(( ((i)) **config.colorDecayRate )*colorStack.colors[colorStack.colors.length-i].weight / totalWeight);
    let r=0, g=0, b=0, averageIllum=0;
    for(let i=0;i<colorStack.colors.length;i++) {
        //if(log) console.log(colorStack.colors[i].color,colorStack.colors[i].illumination, globalWeights[i])
        r+=colorStack.colors[i].color[0]*  globalWeights[i]/255;
        g+=colorStack.colors[i].color[1]* globalWeights[i]/255;
        b+=colorStack.colors[i].color[2]* globalWeights[i]/255;

        averageIllum += colorStack.colors[i].illumination * globalWeights[i]
    }
    //if(log) console.log([r*averageIllum,g*averageIllum,b*averageIllum], averageIllum);
    if(averageIllum == 0) return [0,0,0];
    let rgb = [Math.round(r*averageIllum),Math.round(g*averageIllum),Math.round(b*averageIllum)];
    return rgb;
}

const createFlatColorMap = () => {
    let flatMap = [];
    for(let i=0;i<module.exports.pixelMap.length;i++) {
        let flatMapRow = [];
        for(let j=0;j<module.exports.pixelMap[i].length;j++) {
            const c = combineColors(module.exports.pixelMap[i][j]);
            flatMapRow.push(c);
        }
        flatMap.push(flatMapRow);
    }
    return flatMap;
}

module.exports.render = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const flatColorMap = post.tonemap(createFlatColorMap());
    for(let i=0;i<flatColorMap.length;i++) {
        for(let j=0;j<flatColorMap[i].length;j++) {
            const c = flatColorMap[i][j];
            ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            ctx.fillRect(i,j,1,1);
        }
    }
    /*const cBuff = canvas.toBuffer("image/png");
    fs.writeFileSync("./output.png",cBuff,(err)=>{if(err)console.error(err)})*/
    pureImage.encodePNGToStream(canvas, fs.createWriteStream(config.outputPath)).then(() => {
        console.log(`\x1b[35mRendered to \x1b[33m${config.outputPath}\x1b[0m\u001B[?25h`);
    }).catch((e)=>{
        console.log("ERROR writing output file: "+ e);
    });
}

module.exports.hslToRGB = (h, s, l) => {
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}