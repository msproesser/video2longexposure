import Jimp from 'jimp'

export function saveImage({data, width, height, filename}) {
    return new Promise((res, error) => new Jimp({data:Buffer.from(data), width, height}, (err, img) => {
        console.log('err is', err); 
        img.writeAsync(filename).then(res).catch(error);
    }))
}

export function average(sum, count, scale) {
    const finalLength = sum.length / scale
    const result = Buffer.alloc(finalLength)
    console.log('avg final buffer length'+(finalLength), result.length)
    for (let index = 0; index < finalLength; index++) {
        const color = sum.readUInt32BE(index * scale);
        result.writeUInt8(color/count, index)
    }
    return result
}

export function incrementalReducer(sum, next, scale) {
    for (let index = 0; index < next.length; index++) {
        const scaledIndex = index * scale
        const nextColor = next.readUint8(index)
        const sumColor = sum.readUInt32BE(scaledIndex)
        sum.writeUInt32BE(nextColor + sumColor, scaledIndex)
    }
    return sum
}