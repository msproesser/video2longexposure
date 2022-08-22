import {cleanAll, namer, extractFrames, buildSplits} from './utils.mjs'
import pairMergeStrategy from './sampleMergeStrategies/pair-merge-strategy.mjs'
import WorkerPool from './worker-pool.mjs'

const wp = new WorkerPool(8)

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

const [videoFile, fps] = process.argv.slice(2);
cleanAll()
.then(() => extractFrames(videoFile, fps))
.then(reducer(layerStrategy(dat => wp.send(dat)), namer('layer', 'sample')))
.then(console.log)
.then(() => process.exit(0))


