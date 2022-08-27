import jimp from 'jimp'

export function saveImage(bitmap, width, height, filename) {
    return new jimp({data:Buffer.from(bitmap), width, height}, (err, img) => {
        console.log('err is', err); img.writeAsync(filename)
    })
}