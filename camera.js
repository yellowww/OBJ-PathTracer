const ray = require("./Ray");

module.exports.rays = [];
module.exports.lightSources = [];
module.exports.rotation = {a:0,b:0}
module.exports.fov = 30;
module.exports.position = {x:0,y:3,z:-30};

module.exports.init = (res,samples) => {
    for(let i=0;i<res.x;i++) {
        for(let j=0;j<res.y;j++) {
            for(let k=0;k<samples;k++) {
                const a = ((i)/(res.x-1)*(module.exports.fov) + (180-(module.exports.fov))/2);
                const b = (j - (res.y-1)/2)/(res.y-1)*(module.exports.fov/(res.x/res.y));
                const pos = module.exports.position;
                module.exports.rays.push(new ray.Ray(
                    {
                        x:pos.x,
                        y:pos.y,z:pos.z
                    },
                    undefined,
                    {a:a+module.exports.rotation.a,b:b*-1+module.exports.rotation.b},
                    {x:i,y:j},
                    i*res.y+j
                ));
            }
        }
    }
}

module.exports.addLightSource = (lightSource) => module.exports.lightSources.push(lightSource);

module.exports.distFrom = (point) => Math.sqrt((point.x-module.exports.position.x)**2 + (point.y-module.exports.position.y)**2 + (point.z-module.exports.position.z)**2);