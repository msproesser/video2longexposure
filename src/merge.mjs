import { hexPixel, hexVectorToFile } from './steps/helpers/jimp-helpers.mjs';
import pureJimpMethod, { incrementalReducer, lightenReducer } from './steps/merge-frames/pure-jimp-strategy.mjs';
import {cleanAll, extractFrames} from './utils.mjs'



const [videoFile, fps] = process.argv.slice(2);
cleanAll()
.then(() => extractFrames(videoFile, fps))
.then(pureJimpMethod(lightenReducer))
.then(hexPixel)
.then(hexVectorToFile('./final.png'))
.then(console.log)
.then(() => process.exit(0))


