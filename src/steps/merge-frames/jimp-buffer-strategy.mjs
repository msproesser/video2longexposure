import Jimp from 'jimp'

/**
 * 
 * @param {Buffer} sum 
 * @param {Buffer} next 
 */
function reducer(sum, next, scale) {
    for (let index = 0; index < next.length; index++) {
        const scaledIndex = index * scale
        const nextColor = next.readUint8(index)
        const sumColor = sum.readUInt32BE(scaledIndex)
        sum.writeUInt32BE(nextColor + sumColor, scaledIndex)
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

export default function jimpBufferStrategy(filename) {
    return async function(fileList) {
        let sum, sample;
        const scale = 4;

        for (const frame of fileList) {
            
            console.log(frame)
            sample = await Jimp.read(frame)
            
            if (sum) {
                sum = reducer(sum, sample.bitmap.data, scale);
            } else {
                console.log('sum length', sample.bitmap.data.length * scale)
                sum = Buffer.alloc(sample.bitmap.data.length * scale);
            }
        }
        const avg = average(sum, fileList.length, scale)
        const [width, height] = [sample.bitmap.width, sample.bitmap.height]
        return new Jimp({data: avg, width, height}, (err, img) => {
            console.log('err is', err); 
            img.writeAsync(filename);
        })
    }
}