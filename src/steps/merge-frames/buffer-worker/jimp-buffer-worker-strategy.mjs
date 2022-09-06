import Jimp from 'jimp'
import WorkerPool from '../../helpers/worker-pool.mjs';
import { average } from '../../helpers/jimp-helpers.mjs';
import { buildSplits } from '../../helpers/utils.mjs';

function reducer(sum, next) {
    for (let index = 0; index < next.length; index+=4) {
        const sumColor = sum.readUInt32BE(index)
        const nextColor = next.readUInt32BE(index)
        sum.writeUInt32BE(nextColor + sumColor, index)
    }
    return sum
}

export default function jimpWorkerBufferStrategy(workerCount = 4) {
    const workerPool = new WorkerPool(workerCount, './src/steps/merge-frames/buffer-worker/worker.mjs');
    return async function(fileList) {
        let sample = await Jimp.read(fileList[0]);
        const scale = 4;
        const splitSize = Math.ceil(fileList.length / workerCount)
        const splits = buildSplits(fileList, splitSize).map(split => workerPool.send( split, {scale}))
        const avg = await Promise.all(splits)
        .then(sums => sums.reduce((sum, next) => reducer(sum, Buffer.from(next.buffer)), Buffer.alloc(Buffer.from(sums[0].buffer).length)))
        .then(sum => average(sum, fileList.length, scale))

        const [width, height] = [sample.bitmap.width, sample.bitmap.height]
        return {data: avg, width, height}
    }
}