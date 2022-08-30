import pureJimpStrategy, { incrementalReducer, jimpWorkerStrategy, lightenReducer } from './steps/merge-frames/pure-jimp-strategy.mjs';
import { cleanAll, extractFrames, readdir } from './steps/helpers/utils.mjs'
import jimpBufferStrategy from './steps/merge-frames/jimp-buffer-strategy.mjs';
import jimpWorkerBufferStrategy from './steps/merge-frames/jimp-worker-buffer-strategy.mjs';

async function listFrames() {
    const list = await readdir('frames');
    return list.filter(f => f.startsWith('frame')).map(f_1 => `./frames/${f_1}`)
}

console.time('all')
const [videoFile, fps] = process.argv.slice(2);

cleanAll(['darkroom', 'frames'])
.then(() => extractFrames(videoFile, fps))
.then(listFrames)
.then(jimpWorkerBufferStrategy('buffered01.png', 8))
.then()
.then(() => console.timeEnd('all'))
.then(() => process.exit(0))


