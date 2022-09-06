import { saveImage } from './steps/helpers/jimp-helpers.mjs';
import { cleanAll, extractFrames, readdir } from './steps/helpers/utils.mjs'
import jimpWorkerBufferStrategy from './steps/merge-frames/buffer-worker/jimp-buffer-worker-strategy.mjs';
import pairMergeStrrategy from './steps/merge-frames/im-pair-worker/pair-merge-strategy.mjs';

async function listFrames() {
    const list = await readdir('frames');
    return list.filter(f => f.startsWith('frame')).map(f_1 => `./frames/${f_1}`)
}

console.time('all')
const [videoFile, fps] = process.argv.slice(2);
const filename = 'buffered01.png'

function imagick() {
    cleanAll(['darkroom', 'frames'])
    .then(() => extractFrames(videoFile, fps))
    .then(listFrames)
    .then(pairMergeStrrategy(4))
    .then(result => saveImage({...result, filename}))
    .then(() => console.timeEnd('all'))
    .then(() => process.exit(0))
}

function jimp() {
    cleanAll(['darkroom', 'frames'])
    .then(() => extractFrames(videoFile, fps))
    .then(listFrames)
    .then(jimpWorkerBufferStrategy(4))
    .then(result => saveImage({...result, filename}))
    .then(() => console.timeEnd('all'))
    .then(() => process.exit(0))
}


jimp()