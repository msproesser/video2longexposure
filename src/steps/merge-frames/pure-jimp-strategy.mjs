import jimp from 'jimp'
import { buildArray, scanToArray, vectorLoop } from '../helpers/jimp-helpers.mjs'

export function incrementalReducer(sum, next) {
    
    vectorLoop(sum, (x, y) => {
        const [r,g,b,a] = sum[x][y]
        const [nr,ng,nb,na] = next[x][y]
        sum[x][y] = [r+nr, g+ng, b+nb, a+na]
    })
    return sum
}
incrementalReducer.postProcess = pixelAvgPostProcessor

export function lightenReducer(sum, next) {
    vectorLoop(sum, (x, y) => {
        const [r,g,b,a] = sum[x][y]
        const [nr,ng,nb,na] = next[x][y]
        sum[x][y] = [
            r < nr ? nr : r, 
            g < ng ? ng : g,  
            b < nb ? nb : b,  
            a < na ? na : a, 
        ]
    })
    return sum
}

function pixelAvgPostProcessor(vector, count) {
    const v = buildArray(vector.length, vector[0].length)
    const avg = color => Math.round(color/count)
    vectorLoop(vector, (x, y, pixel) => {
        const [r,g,b,a] = pixel
        v[x][y] = [avg(r), avg(g), avg(b), avg(a)]
    })
    return v
}

export default function pureJimpMethod(reducer) {
    return async function(fileList) {
        let sum;
        for (const frame of fileList) {
            
            console.log(frame)
            const imgArr = await jimp.read(frame).then(scanToArray);
            if (sum) {
                sum = reducer(sum, imgArr);
            } else {
                sum = imgArr;
            }
        }
        return reducer.postProcess ? reducer.postProcess(sum, fileList.length) : sum
    }
}

