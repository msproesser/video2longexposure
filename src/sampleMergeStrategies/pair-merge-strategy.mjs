import {exec} from '../utils.mjs'
export default async function pairMergeStrategy({fileList, outName}) {
    const [f1, f2, ...unused] = fileList
    if (!f2) return Promise.resolve({input: [f1], output: f1, unused: [f1]}) 
    return exec(`composite -blend 50x50 ${f1} ${f2} -alpha Set darkroom/${outName}.png`)
    .then(() => ({
        input: [f1, f2],
        output: `darkroom/${outName}.png`,
        unused,
    }))
}
