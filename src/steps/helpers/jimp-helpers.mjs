import jimp from 'jimp'

export function hexPixel(imgVector) {
    const hexVector = buildArray(imgVector.length, imgVector[0].length)
    vectorLoop(imgVector, (x,y, pixel) => {
        const [r,g,b,a] = pixel;
        hexVector[x][y] = jimp.rgbaToInt(r,g,b,a)
    })
    return hexVector
}

export function hexVectorToFile(fileName) {
    return async function(hexVector) {
        const [width, height] = [hexVector.length, hexVector[0].length]
        return new Promise((res, _) => {
            new jimp(width, height, '#FFFFFF', (_, img) => res(img))
        }).then(image => {
            vectorLoop(hexVector, (x,y, pixel) => {
                image.setPixelColor(pixel, x, y)
            })
            return image.writeAsync(fileName)
        })
    }
}

export function buildArray(width, height) {
    return [... new Array(width)].map(l => ([... new Array(height)]))
}

export function vectorLoop(vector, loopFn) {
    for (let x = 0; x < vector.length; x++) {
        for (let y = 0; y < vector[x].length; y++) {
            loopFn(x, y, vector[x][y])
        }
    }
}

export function scanToArray(image) {
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