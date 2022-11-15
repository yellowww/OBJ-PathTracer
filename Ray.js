module.exports.rayConversion = {
    rtd: 180/Math.PI,
    angToHeading:(ang) => {
        const rtd = module.exports.rayConversion.rtd;
        return {
            x:Math.cos(ang.a/rtd) * Math.cos(ang.b/rtd),
            y:Math.sin(ang.b/rtd),
            z:Math.sin(ang.a/rtd) * Math.cos(ang.b/rtd)
        };
    },
    headingToAng:(head) => {
        const rtd = module.exports.rayConversion.rtd;
        const mag = (head.x**2+head.y**2+head.z**2)**0.5;
        const b = Math.asin(head.y/mag);
        return {
            a:Math.asin(head.z/Math.cos(b))*rtd,
            b:b*rtd
        }
    }
}


module.exports.Ray = class Ray {
    constructor(em,head,ang,px,id) {
        this.constantId = id;
        this.emanation = em;
        this.missed = false;
        this.hitStack = [];
        this.pxOrigin = px;
        if(head == undefined) this.heading = module.exports.rayConversion.angToHeading(ang);
        else this.heading = head;
        if(ang == undefined) this.angle = module.exports.rayConversion.headingToAng(head);
        else this.angle = ang;
    }
}