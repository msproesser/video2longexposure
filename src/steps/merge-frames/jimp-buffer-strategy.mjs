import Jimp from 'jimp'
import { average, incrementalReducer } from '../helpers/jimp-helpers.mjs'


export default function jimpBufferStrategy() {
    return async function(fileList) {
        let sum, sample;
        const scale = 4;

        for (const frame of fileList) {
            
            console.log(frame)
            sample = await Jimp.read(frame)
            
            if (sum) {
                sum = incrementalReducer(sum, sample.bitmap.data, scale);
            } else {
                sum = Buffer.alloc(sample.bitmap.data.length * scale);
            }
        }
        const data = average(sum, fileList.length, scale)
        const [width, height] = [sample.bitmap.width, sample.bitmap.height]
        return {data, width, height}
    }
}