import {exec, cleanAll, namer, extractFrames} from './utils.mjs'

function pairJoin(fileList, namer) {
    const outName = namer.sample()
    const [f1, f2, ...unused] = fileList
    if (!f2) return Promise.resolve({input: [f1], output: null}) 
    return exec(`composite -blend 50x50 ${f1} ${f2} -alpha Set darkroom/${outName}.png`)
    .then(() => ({
        input: [f1, f2],
        output: `darkroom/${outName}.png`,
        unused,
    }))
}

function reducer(layerStrategy, namer) {
    return async function red(fileList) {
        const result = await layerStrategy(fileList, namer)
        if (result.length <= 1) return result.pop()
        namer.newLayer()
        return red(result)
    }
}

function layerStrategy(mergeStrategy) {
    return async function layer(fileList, namer) {
        const mergeResult = await mergeStrategy(fileList, namer)
        if (mergeResult.unused) {
            return layer(mergeResult.unused, namer)
            .then(result => result.concat(mergeResult.output))
            .then(list => list.filter(file => !!file))
        }
        return [mergeResult.output]
    }
}

const [videoFile, fps] = process.argv.slice(2);
cleanAll()
.then(() => extractFrames(videoFile, fps))
.then(reducer(layerStrategy(pairJoin), namer('layer', 'sample')))
.then(console.log)


