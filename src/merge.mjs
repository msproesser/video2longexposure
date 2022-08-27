
import pureJimpStrategy, { incrementalReducer, lightenReducer } from './steps/merge-frames/pure-jimp-strategy.mjs';
import {cleanAll, extractFrames, readdir} from './steps/helpers/utils.mjs'
import batchedJimpGpuStrategy from './steps/merge-frames/gpu-bitmap-arg-strategy.mjs';


console.time('all')
const [videoFile, fps] = process.argv.slice(2);

cleanAll(['frames', 'darkroom'])
.then(() => extractFrames(videoFile, fps))
.then(batchedJimpGpuStrategy)
.then((x) => x.subscribe(() => console.timeEnd('all')))


