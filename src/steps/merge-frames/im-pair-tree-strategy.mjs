import { buildSplits } from "../../utils.mjs"

function reducer(layerStrategy, namer) {

    return async function red(fileList) {
        console.log('red', fileList)
        const result = await layerStrategy(fileList, namer)
        if (result.length <= 1) return result.pop()
        namer.newLayer()
        return red(result)
    }
}

function layerStrategy(mergeStrategy) {
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
