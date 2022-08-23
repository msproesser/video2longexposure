import { GPU } from 'gpu.js'

const gpu = new GPU()

function mply(n) {
    return [[n,n,n,n,n],[n,n,n,n,n],[n,n,n,n,n],[n,n,n,n,n],[n,n,n,n,n]]
}
const output = [5, 5]
let starter = gpu.createKernel(function(first) {
    return first[this.thread.x][this.thread.y];
}).setOutput([5, 5]).setPipeline(true);

let reduce = gpu.createKernel(function(_, next) {
    const array2 = this.constants.texture[this.thread.x][this.thread.y] + next[this.thread.x][this.thread.y];
    return array2;
}).setOutput([5, 5]).setPipeline(true);

/*
const sample = mply(1)
const pipe = starter(sample)
reduce.setConstants({texture: pipe})
const p2 = reduce(pipe, mply(2))
*/

import jimp from 'jimp'
import { readdir } from './utils.mjs';

function vectorLoop(vector, loopFn) {
    for (let x = 0; x < vector.length; x++) {
        for (let y = 0; y < vector[x].length; y++) {
            loopFn(x, y, vector[x][y])
        }
    }
}
function buildArray(width, height) {
    return [... new Array(width)].map(l => ([... new Array(height)]))
}
function scanToArray(image) {
    const imgVector = buildArray(image.bitmap.width, image.bitmap.height)
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        // x, y is the position of this pixel on the image
        // idx is the position start position of this rgba tuple in the bitmap Buffer
        // this is the image
      
        var red = this.bitmap.data[idx + 0];
        var green = this.bitmap.data[idx + 1];
        var blue = this.bitmap.data[idx + 2];
        var alpha = this.bitmap.data[idx + 3];
        const pixel = [red, green, blue, alpha];
        imgVector[x][y] = pixel
        // rgba values run from 0 - 255
        // e.g. this.bitmap.data[idx] = 0; // removes red from this pixel
      });
    return imgVector
}

function hexPixel(imgVector) {
    const hexVector = buildArray(imgVector.length, imgVector[0].length)
    vectorLoop(imgVector, (x,y, pixel) => {
        const [r,g,b,a] = pixel;
        hexVector[x][y] = jimp.rgbaToInt(r,g,b,a)
    })
    return hexVector
}

function hexVectorToImg(hexVector) {
    const [width, height] = [hexVector.length, hexVector[0].length]
    return new Promise((res, _) => {
        new jimp(width, height, '#FFFFFF', (_, img) => res(img))
    }).then(image => {
        vectorLoop(hexVector, (x,y, pixel) => {
            image.setPixelColor(pixel, x, y)
        })
        image.write('./test.png')
    })
}

function reducer(sum, next) {
    vectorLoop(sum, (x, y) => {
        const [r,g,b,a] = sum[x][y]
        const [nr,ng,nb,na] = next[x][y]
        sum[x][y] = [r+nr, g+ng, b+nb, a+na]
    })
    return sum
}

function lighten(sum, next) {
    vectorLoop(sum, (x, y) => {
        const [r,g,b,a] = sum[x][y]
        const [nr,ng,nb,na] = next[x][y]
        sum[x][y] = [
            r < nr ? nr : r, 
            g < ng ? ng : g,  
            b < nb ? nb : b,  
            a < na ? na : a, 
        ]
    })
    return sum
}
function pixelAvg(vector, count) {
    const v = buildArray(vector.length, vector[0].length)
    const avg = color => Math.round(color/count)
    vectorLoop(vector, (x, y, pixel) => {
        const [r,g,b,a] = pixel
        v[x][y] = [avg(r), avg(g), avg(b), avg(a)]
    })
    return v
}


async function pureJimpMethod(reducer, postProcess = sum => sum) {
    const list = await readdir('frames').then(l => l.filter(f => f.startsWith('frame')).map(f_1 => `./frames/${f_1}`));
    let sum;
    for (const frame of list) {
        
        console.log(frame)
        const imgArr = await jimp.read(frame).then(scanToArray);
        if (sum) {
            sum = reducer(sum, imgArr);
        } else {
            sum = imgArr;
        }
    }
    return postProcess(sum, list.length)
}

pureJimpMethod(reducer, pixelAvg)
.then(hexPixel)
.then(hexVectorToImg)


//jimp.read('./frames/frame-0000001.png').then(scanToArray).then(hexPixel).then(hexVectorToImg)
