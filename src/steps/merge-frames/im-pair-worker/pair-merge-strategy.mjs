import {exec, buildSplits, namer} from '../../helpers/utils.mjs'
import WorkerPool from '../../helpers/worker-pool.mjs'
export async function pairMerge({fileList, outName}) {
    const [f1, f2, ...unused] = fileList
    if (!f2) return Promise.resolve({input: [f1], output: f1, unused}) 
    return exec(`composite -blend 50x50 ${f1} ${f2} -alpha Set darkroom/${outName}.png`)
    .then(() => ({
        input: [f1, f2],
        output: `darkroom/${outName}.png`,
        unused,
    }))
}

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
        const splits = buildSplits(fileList)
        const results = await Promise.all(splits
        .map(pair => ({fileList: pair, outName: namer.sample()}))
        .map(mergeStrategy))
        .then(results => results.map(result => result.output))
        console.log('results', results)
        return results
    }
}

export default function(workerPoolSize = 4) {
    const wp = new WorkerPool(workerPoolSize, './src/steps/merge-frames/im-pair-worker/worker.mjs')

    return reducer(layerStrategy(dat => wp.send(dat)), namer('layer', 'sample'))
}