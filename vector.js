module.exports = {
    mag:(v) => {
        return (v.x**2 + v.y**2 + v.z**2)**0.5;
    },
    dot:(v0, v1) => {
        return (v0.x*v1.x + v0.y*v1.y + v0.z*v1.z);
    },
    sub:(v0, v1) => {
        return {x:v0.x-v1.x, y: v0.y-v1.y, z: v0.z-v1.z};
    },
    add:(v0, v1) => {
        return {x:v0.x+v1.x, y: v0.y+v1.y, z: v0.z+v1.z};
    },
    mult:(v, k) => {
        return {x:v.x*k, y:v.y*k, z:v.z*k}
    },
    div:(v, k) => {
        return {x:v.x/k, y:v.y/k, z:v.z/k}
    },
    normalize:(v) => {
        return module.exports.div(v, module.exports.mag(v));
    },
    equ:(v0, v1) => {
        return v0.x == v1.x && v0.y == v1.y && v0.z == v1.z;
    },
    cross:(v0, v1) => {
        return {
            x:v0.y*v1.z - v0.z * v1.y, 
            y:v0.z*v1.x - v0.x * v1.z,
            z:v0.x*v1.y - v0.y * v1.x
        }
    },
    dist:(p0, p1) => {
        return (
            (p0.x-p1.x)**2 +
            (p0.y-p1.y)**2 +
            (p0.z-p1.z)**2
        ) ** 0.5;
    }
}
