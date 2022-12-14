import { promisify } from 'util'; 
import { rmSync, mkdirSync, readdir as _readdir } from 'fs';
import { exec as _exec, spawn} from 'child_process'
const exec = promisify(_exec);
const readdir = promisify(_readdir)

function buildSplits(list, chunkSize = 2) {
    const chunkList = []
    for (let i = 0; i < list.length; i += chunkSize) {
        chunkList.push(list.slice(i, i + chunkSize));
    }
    return chunkList
}

function cleanAll(folderList = []) {
    folderList.forEach(f => {
        rmSync(`./${f}`, { recursive: true, force: true })
        mkdirSync(`./${f}`)
    })
    return Promise.resolve()
}

async function extractFrames(filename, fps = 30) {
    const targetFolder = 'frames'
    const prefix = 'frame'
    await exec(`ffmpeg -i "${filename}" -vf fps=${fps} -pix_fmt rgb24 ${targetFolder}/${prefix}-%07d.png`);
    const list = await readdir(targetFolder);

    return list.filter(f => f.startsWith(prefix)).map(f_1 => `./frames/${f_1}`);
}

function extractFrameStream(filename, fps = 30) {
    return spawn('ffmpeg', [
        '-i', filename,
        '-vf', 'fps='+fps,
        '-pix_fmt', 'rgb24',
        '-f', 'rawvideo',
        'pipe:1'
    ]);
}

//ffprobe -v quiet -print_format json -show_streams vids/ns01.mp4
function getVideoDetails(filename) {
    return exec(`ffprobe -v quiet -print_format json -show_streams ${filename}`)
    .then(result => JSON.parse(result.stdout).streams.filter(stream => stream.codec_type === 'video')[0])
}


function namer(layer = 'layer', sample = 'Spl') {
    function* nameGenerator(prefix) {
        let counter = 0;
        while(true) {
            yield `${prefix}${counter}`
            counter++
        }
    }
    const layerNamer = nameGenerator(layer)
    const _gen = {
        newLayer() {
            _gen._layer = layerNamer.next().value
            _gen.sampleNamer = nameGenerator(_gen._layer + `-${sample}`)
            return _gen._layer
        },
        sample() {
            return _gen.sampleNamer.next().value
        }
    }
    _gen.newLayer()
    return _gen
}

async function listFrames() {
    const list = await readdir('frames');
    return list.filter(f => f.startsWith('frame')).map(f_1 => `./frames/${f_1}`)
}

export {exec, readdir, buildSplits, cleanAll, extractFrames, namer, extractFrameStream, getVideoDetails, listFrames}