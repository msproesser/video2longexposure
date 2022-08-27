import jimp from 'jimp'
import { saveImage } from '../helpers/jimp-helpers.mjs'

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
            sample = await jimp.read(frame)
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

