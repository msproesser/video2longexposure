import { hexPixel, hexVectorToFile } from './steps/helpers/jimp-helpers.mjs';
import jimpGpuStrategy from './steps/merge-frames/jimp-gpu-strategy.mjs';
import pureJimpStrategy, { incrementalReducer, lightenReducer } from './steps/merge-frames/pure-jimp-strategy.mjs';
import {cleanAll, extractFrames} from './steps/helpers/utils.mjs'



const [videoFile, fps] = process.argv.slice(2);
cleanAll(['frames', 'darkroom'])
.then(() => extractFrames(videoFile, fps))
.then(jimpGpuStrategy)
.then(hexPixel)
.then(hexVectorToFile('./final.png'))
.then(console.log)
.then(() => process.exit(0))


