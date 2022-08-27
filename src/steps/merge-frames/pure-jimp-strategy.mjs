import Jimp from 'jimp'
import WorkerPool from '../../worker-pool.mjs';
import { saveImage } from '../helpers/jimp-helpers.mjs'
import { buildSplits } from '../helpers/utils.mjs';

export function incrementalReducer(sum, next) {
    for (let index = 0; index < sum.length; index++) {
        sum[index] = sum[index] + next[index];
    }
    return sum
}
incrementalReducer.postProcess = pixelAvgPostProcessor

export function lightenReducer(sum, next) {
    for (let index = 0; index < sum.length; index++) {
        sum[index] = sum[index] < next[index] ? next[index] : sum[index];
    }
    return sum
}

function pixelAvgPostProcessor(vector, count) {
    const avg = color => Math.round(color/count)
    for (let index = 0; index < vector.length; index++) {
        vector[index] = avg(vector[index]);
        
    }
    return vector
}

export default function pureJimpStrategy(reducer) {
    return async function(fileList) {
        let sum, sample;
        for (const frame of fileList) {
            
            console.log(frame)
            sample = await Jimp.read(frame)
            if (sum) {
                sum = reducer(sum, [...sample.bitmap.data]);
            } else {
                sum = [...sample.bitmap.data];
            }
        }
        const avg = reducer.postProcess ? reducer.postProcess(sum, fileList.length) : sum
        return saveImage(avg, sample.bitmap.width, sample.bitmap.height, 'pure-final.png')
    }
}

export function jimpWorkerStrategy(size = 6) {
    const workerPool = new WorkerPool(size)
    return async function(fileList) {

        const sample = await Jimp.read(fileList[0])
        const [width, height] = [sample.bitmap.width, sample.bitmap.height]

        const splitSize = Math.ceil(fileList.length / size)
        console.log('Splits of:', splitSize)
        const splits = buildSplits(fileList, splitSize)
        
        const result = await Promise.all(splits.map(batch => workerPool.send(batch)))
        .then(sums => sums.reduce(incrementalReducer))
        .then(sum => pixelAvgPostProcessor(sum, fileList.length))

        return saveImage(result, width, height, 'pure-final.png')
    }
}