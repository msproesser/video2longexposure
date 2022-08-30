import Jimp from 'jimp'
import WorkerPool from '../../worker-pool.mjs';
import { buildSplits } from '../helpers/utils.mjs';

function reducer(sum, next) {
    console.log('inal reduction', {sum, next})
    for (let index = 0; index < next.length; index+=4) {
        const sumColor = sum.readUInt32BE(index)
        const nextColor = next.readUInt32BE(index)
        sum.writeUInt32BE(nextColor + sumColor, index)
    }
    return sum
}

function average(sum, count, scale) {
    const finalLength = sum.length / scale
    const result = Buffer.alloc(finalLength)
    console.log('avg final buffer length'+(finalLength), result.length)
    for (let index = 0; index < finalLength; index++) {
        const color = sum.readUInt32BE(index * scale);
        result.writeUInt8(color/count, index)
    }
    return result
}

export default function jimpWorkerBufferStrategy(filename, workerCount = 4) {
    const workerPool = new WorkerPool(workerCount);
    return async function(fileList) {
        let sample = await Jimp.read(fileList[0]);
        const scale = 4;
        const splitSize = Math.ceil(fileList.length / workerCount)
        const splits = buildSplits(fileList, splitSize).map(split => workerPool.send( split, {scale}))
        const avg = await Promise.all(splits)
        .then(sums => sums.reduce((sum, next) => reducer(sum, Buffer.from(next.buffer)), Buffer.alloc(Buffer.from(sums[0].buffer).length)))
        .then(sum => average(sum, fileList.length, scale))

        const [width, height] = [sample.bitmap.width, sample.bitmap.height]
        return new Promise((res, err) => new Jimp({data: avg, width, height}, (err, img) => {
            console.log('err is', err); 
            img.writeAsync(filename).then(res).catch(err);
        }))
    }
}