const config = require("./config.js");

module.exports.tonemap = (pixelMap) => {
    const aLevel = config.toneMapping.activationLevel;
    const strength = config.toneMapping.strength;
    for(let i=0;i<pixelMap.length;i++) {
        for(let j=0;j<pixelMap[i].length;j++) {
            let thisColor = pixelMap[i][j];
            if(thisColor[0] > aLevel) thisColor[0] = Math.round(Math.pow(thisColor[0]-(aLevel-1),1/strength) + (aLevel-1));
            if(thisColor[1] > aLevel) thisColor[1] = Math.round(Math.pow(thisColor[1]-(aLevel-1),1/strength) + (aLevel-1));
            if(thisColor[2] > aLevel) thisColor[2] = Math.round(Math.pow(thisColor[2]-(aLevel-1),1/strength) + (aLevel-1));
            for(let k=0;k<thisColor.length;k++) if(thisColor[k] > 255) thisColor[k] = 255;
            pixelMap[i][j] = thisColor;
        }
    }
    return pixelMap;
}