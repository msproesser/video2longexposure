# video to longexposure

## Journey

Built this project to create images that looks like long exposure photos based on video samples.

In the beggining of the project I tried to use [imagemagick](https://imagemagick.org/) as an old known lib and turns out it worked really well (check tag v0.3-worker-based). 
The process based on imagemagick is good to see the steps of merging and you can check the halfstep samples to see lower levels of this long exposure

However the imagemagick based strategy was a bit slow and became worse on 8K samples so I tried another strategies like array processing using the [Jimp](https://www.npmjs.com/package/jimp) lib which was way faster than imagemagick at the beggining but couln't handle the large images when converting to a classic javascript number array (tag v0.4).

Then I tried processing on GPU, using the [gpu.js](https://gpu.rocks/#/) lib, this approach was little bit faster than jimp alone but took too much effort to configure the gpu kernel function and had the same problem of classic number array for larger images (tag v0.5). 

To solve the problem of large arrays I used the buffer directly processing color by color of bitmap and reducing the sum of each pixel to a bigger buffer then mapping back the reduction to a bitmap with the average of each pixel.

## Usage

The scripts starts on `merge.mjs`, it requires the video file path and a framerate, `node merge.mjs vids/test4.mp4 30` . the result will be sabe as `buffered01.png`, I didn't add any configuration to output however it's possible to change directly into merge.mjs file at `const filename="result.png"`.
It's using the last version created, buffer process over workers to split the process between CPU cores.