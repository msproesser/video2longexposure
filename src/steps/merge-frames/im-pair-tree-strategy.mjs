import { buildSplits, namer } from "../helpers/utils.mjs"
import {exec} from '../utils.mjs'

export function reducer(layerStrategy, namer) {

    return async function red(fileList) {
        console.log('red', fileList)
        const result = await layerStrategy(fileList, namer)
        if (result.length <= 1) return result.pop()
        namer.newLayer()
        return red(result)
    }
}

export function layerStrategy(mergeStrategy) {
    return async function layer(fileList, namer) {
        const splits = await buildSplits(fileList)
        const results = await Promise.all(splits
        .map(pair => ({fileList: pair, outName: namer.sample()}))
        .map(mergeStrategy))
        .then(results => results.map(result => result.output))
        console.log('results', results)
        return results
    }
}


export async function pairMergeStrategy({fileList, outName}) {
    const [f1, f2, ...unused] = fileList
    if (!f2) return Promise.resolve({input: [f1], output: f1, unused: [f1]}) 
    return exec(`composite -blend 50x50 ${f1} ${f2} -alpha Set darkroom/${outName}.png`)
    .then(() => ({
        input: [f1, f2],
        output: `darkroom/${outName}.png`,
        unused,
    }))
}

export default reducer(layerStrategy(pairMergeStrategy), namer())