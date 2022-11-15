
module.exports.totalIterationCount;


const createProgressBar = (length, p, color) => {
    if(color == undefined) color = "\x1b[46m"
    let string = "\x1b[1m[\x1b[36m"+color;
    for(let i=0;i<length;i++) {
        if(i<p*length) {
        } else {
            if(i-1<p*length) string+="\x1b[0m\x1b[2m"
        }                
        string+=" ";
    }
    string+="\x1b[0m\x1b[1m]\x1b[0m";
    string += ` ${formatPercent(p)}%`;
    return string;
}

const averageThreadCompletion = (threadCompletion) => {
    if(threadCompletion.length == 0) return 1;
    let sum = 0;
    for(let i=0;i<threadCompletion.length;i++) sum+=threadCompletion[i];
    return sum/threadCompletion.length;
}

const formatTime = (ms, space) => {
    if(space == undefined) space = false;
    if(ms == -1) return "-- : --";
    let seconds = Math.floor(ms / 1000);
    let min = Math.floor(seconds / 60);
    let hour = Math.floor(min / 60);
    seconds = (seconds%60).toString();
    if(seconds.length < 2) seconds = "0"+seconds;
    min = (min%60).toString();
    if(min.length < 2) min = "0"+min;
    if(hour < 1) return `${min} : ${seconds}`;
    
    hour = (hour).toString();
    if(hour.length < 2) hour = "0"+hour;
    if(space) return `${hour} : ${min} : ${seconds}`;
    return `${hour}:${min}:${seconds}`;
}

module.exports.formatTime = formatTime;

const formatPercent = (p) => {
    let s = Math.round(p*100).toString();
    if(s.length == 1) s = "0"+s;
    return s;
}

const calculateTimeRemaining = (time, p) => {
    if(p == 0) return -1;
    return (time / p) * (1-p);
}

module.exports.print = (deleteLast, iteration, totalTime, time, threadCompletion, rays, message) => {
    if(deleteLast) {
        process.stdout.write("\r\x1b[K");
        process.stdout.write("\033[F\r\x1b[K");
        process.stdout.write("\033[F\r\x1b[K");        
    } else {
        process.stdout.write("\033[F\r");
        process.stdout.write("\033[F\r");           
    }
    const p = averageThreadCompletion(threadCompletion);
    process.stdout.write(format([
        iteration.toString() + " of "+module.exports.totalIterationCount,
        formatTime(totalTime),
        formatTime(time),
        formatTime(calculateTimeRemaining(time, p)),
        threadCompletion.length.toString(),
        "\x1b[31m"+rays.toString(),
        message==undefined?createProgressBar(12, p,"\x1b[45m"):message
    ],10));
}

module.exports.newIteration = () => {
    process.stdout.write("\n\n");
}

module.exports.init = () => {
    process.stdout.write(format([
        "iteration",
        "total time",
        "time",
        "remaining",
        "threads",
        "rays",
        "progress"
    ], 10));
}

const format = (info, colLength) => {
    let string = "";
    for(let i=0;i<info.length;i++) {
        string += info[i];
        let inEscapeCode = false;
        let escCodeChars = 0;
        for(let j=0;j<info[i].length;j++) {
            if(info[i].charCodeAt(j) == 27) inEscapeCode = true;
            if(inEscapeCode) escCodeChars++;
            if(info[i][j] == "m" && inEscapeCode) inEscapeCode = false;
        }

        for(let j=0;j<colLength-(info[i].length - escCodeChars);j++) string +=" ";

        if(i<info.length-1) string += "\x1b[0m | ";
    }
    string += "\n\x1b[0m";
    for(let i=2;i<(colLength)*info.length+3*(info.length+2)+1;i++) string +="-";
    return string+"\n";
}