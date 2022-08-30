import Jimp from "jimp";
import { workerData, parentPort, isMainThread } from "worker_threads";
import pureJimpStrategy, {incrementalReducer} from "./steps/merge-frames/pure-jimp-strategy.mjs";

/**
 * 
 * @param {Buffer} sum 
 * @param {Buffer} next 
 */
 function reducer(sum, next, scale) {
  for (let index = 0; index < next.length; index++) {
      const scaledIndex = index * scale
      const nextColor = next.readUint8(index)
      const sumColor = sum.readUInt32BE(scaledIndex)
      sum.writeUInt32BE(nextColor + sumColor, scaledIndex)
  }
  return sum
}

async function sum(payload, scale) {
  let length = await Jimp.read(payload[0]).then(img => img.bitmap.data.length);
  let result = Buffer.alloc(length * scale)

  for (const frameFile of payload) {
    console.log(workerData, frameFile)
    result = await Jimp.read(frameFile)
    .then(sample  => reducer(result, sample.bitmap.data, scale)
    )
  }
  return result
}
parentPort.on("message", async function(message) {
  if (message === "exit") {
    parentPort.close();
    return;
  } 
  console.log('reading message', message)
  const payload = message.payload
  const headers = message.headers
  let result = await sum(payload, headers.scale)
  parentPort.postMessage({ data: result, headers })
  
});

console.log('worker started', workerData)