import { GPU } from 'gpu.js';
import jimp from 'jimp';
import { readdir } from './utils.mjs';

const gpu = new GPU()



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

function pixelAvg(vector, count) {
    const v = buildArray(vector.length, vector[0].length)
    const avg = color => Math.round(color/count)
    vectorLoop(vector, (x, y, pixel) => {
        const [r,g,b,a] = pixel
        v[x][y] = [avg(r), avg(g), avg(b), avg(a)]
    })
    return v
}

function gpuBuild(frame) {
    const starter = gpu.createKernel(function(first) {
        const [r,g,b,a] = first[this.thread.y][this.thread.x]
        return [r,g,b,a];
    })
    .setOutput([frame[0].length, frame.length])
    .setImmutable(true)
    .setPipeline(true);
    
    const gpuReducer = gpu.createKernel(function(sum, next) {
        const s = sum[this.thread.y][this.thread.x];
        const [sr, sg, sb, sa] = s
        const v = next[this.thread.y][this.thread.x];
        const [r,g,b,a] = v
        return [r + sr, g + sg, b + sb, a + sa]
    }, {argumentTypes: {sum: 'Array2D(4)', next: 'Array2D(4)'}})
    .setOutput([frame[0].length, frame.length])
    .setImmutable(true)
    .setPipeline(true);

    const avg = gpu.createKernel(function(vector, count) {
        const color = vector[this.thread.y][this.thread.x][this.thread.z]
        return Math.fround(color / count );
    })
    .setOutput([frame[0].length, frame.length, 4])
    .setImmutable(true)
    .setPipeline(true);
    return [starter, gpuReducer, avg]
}


async function aaa() {

    const list = await readdir('frames').then(l => l.filter(f => f.startsWith('frame')).map(f_1 => `./frames/${f_1}`));
    const first = await jimp.read(list.shift()).then(scanToArray)
    const [starter, gpuReducer, avg] = gpuBuild(first)
    let sum = starter(first)
    for (const frame of list) {
        console.log(frame)
        const imgArr = await jimp.read(frame).then(scanToArray);
        sum = gpuReducer(sum, imgArr);
    }
    console.log('OK', list.length)
    return pixelAvg(sum.toArray(), list.length + 1)
    const result = avg(sum, list.length+0.01)

    return result.toArray()
}

aaa()
.then(r => {
    //console.log(r);
    return r;
})
.then(hexPixel)
.then(hexVectorToImg)


//jimp.read('./frames/frame-0000001.png').then(scanToArray).then(hexPixel).then(hexVectorToImg)
