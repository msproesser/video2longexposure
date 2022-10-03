import { saveImage } from './steps/helpers/jimp-helpers.mjs';
import { cleanAll, extractFrames, listFrames } from './steps/helpers/utils.mjs';
import jimpWorkerBufferStrategy from './steps/merge-frames/buffer-worker/jimp-buffer-worker-strategy.mjs';

function jimp(videoFile, fps, filename, workerCount = 4) {
    cleanAll(['frames'])
    .then(() => extractFrames(videoFile, fps))
    .then(listFrames)
    .then(jimpWorkerBufferStrategy(workerCount))
    .then(result => saveImage({...result, filename}))
    .then(() => process.exit(0))
}

const [
    videoFile, 
    fps = 30, 
    filename = 'buffered01.png'
] = process.argv.slice(2);

jimp(videoFile, fps, filename)