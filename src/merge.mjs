import {cleanAll, namer, extractFrames} from './utils.mjs'
import pairMergeStrategy from './sampleMergeStrategies/pairMergeStrategy.mjs'

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
        const mergeResult = await mergeStrategy({fileList, outName: namer.sample()})
        if (mergeResult.output) {
            return layer(mergeResult.unused, namer)
            .then(result => result.concat(mergeResult.output))
            .then(list => list.filter(file => !!file))
        }
        return [...mergeResult.unused]
    }
}

const [videoFile, fps] = process.argv.slice(2);
cleanAll()
.then(() => extractFrames(videoFile, fps))
.then(reducer(layerStrategy(pairMergeStrategy), namer('layer', 'sample')))
.then(console.log)


