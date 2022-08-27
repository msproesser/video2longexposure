import { GPU } from 'gpu.js';
import jimp from 'jimp';
import { from, map, mergeMap, reduce, startWith, tap } from 'rxjs'
import { saveImage } from '../helpers/jimp-helpers.mjs';

const gpu = new GPU()

function gpuBuild(dimensions) {
    const batchReducer = gpu.createKernel(function(sum, batch) {
        var sumPixelColor = sum[0][this.thread.x];
        var addPixelColor = batch[0][this.thread.x];

        return sumPixelColor + addPixelColor;
    }, {argumentTypes: {sum: 'Array' , batch: 'Array'}})
    .setOutput(dimensions)
    .setImmutable(true)
    .setPipeline(true);

    const average = gpu.createKernel(function(batch, count) {
        var avg = batch[this.thread.x] / count;
        return Math.round(avg);
    }, {argumentTypes: {batch: 'Array', count: 'Integer'}})
    .setOutput(dimensions)
    .setImmutable(true)
    .setPipeline(true);
    return [batchReducer, average]
}

export default async function batchedJimpGpuStrategy(fileList) {

    const first = await jimp.read(fileList.shift())
    const [height, width] = [first.getHeight(), first.getWidth()] // H x W
    console.log({height, width})

    const [batchReducer, average] = gpuBuild([height * width * 4])
    let sum = [...first.bitmap.data]
    return from(fileList).pipe(
        tap(console.log),
        mergeMap(frame => from(jimp.read(frame).then(img => [...img.bitmap.data]).then(x => console.log('read frame', frame) || x))),
        startWith(sum),
        reduce((acc, next) => console.log('new reduction') || batchReducer(acc, next)),
        map(reduced => average(reduced, fileList.length + 1)),
        tap(final => saveImage(final.toArray(), width, height, 'teste.png'))
    )

    //return buildSplits(await buildSplits(sum.toArray(), 4), height)
}