import { GPU } from 'gpu.js';
import jimp from 'jimp';
import { scanToArray } from '../helpers/jimp-helpers.mjs';
const gpu = new GPU()

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
        const color = vector[this.thread.y][this.thread.x];
        const [r,g,b,a] = color;
        const ar = r/count
        const ag = g/count
        const ab = b/count
        const aa = a/count

        return [ar,ag,ab,aa];
    })
    .setOutput([frame[0].length, frame.length])
    .setImmutable(true)
    .setPipeline(true);
    return [starter, gpuReducer, avg]
}

export default async function jimpGpuStrategy(fileList) {

    const first = await jimp.read(fileList.shift()).then(scanToArray)
    const [starter, gpuReducer, avg] = gpuBuild(first)
    let sum = starter(first)
    for (const frame of fileList) {
        console.log(frame)
        const imgArr = await jimp.read(frame).then(scanToArray);
        sum = gpuReducer(sum, imgArr);
    }
    const result = avg(sum, fileList.length + 1)

    return result.toArray()
}