import { cleanAll, extractFrames, listFrames } from './steps/helpers/utils.mjs';
import pairMergeStrategy from './steps/merge-frames/im-pair-worker/pair-merge-strategy.mjs';

function imagick(videoFile, fps = 30) {
    cleanAll(['darkroom', 'frames'])
    .then(() => extractFrames(videoFile, fps))
    .then(listFrames)
    .then(pairMergeStrategy(4))
    .then(() => process.exit(0))
}

const [videoFile, fps = 30] = process.argv.slice(2);
imagick(videoFile, fps)