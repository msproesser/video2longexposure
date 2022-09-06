import Jimp from "jimp";
import { workerData, parentPort, isMainThread } from "worker_threads";
import { incrementalReducer } from "../../helpers/jimp-helpers.mjs";


async function sum(payload, scale) {
  let length = await Jimp.read(payload[0]).then(img => img.bitmap.data.length);
  let result = Buffer.alloc(length * scale)

  for (const frameFile of payload) {
    console.log(workerData, frameFile)
    result = await Jimp.read(frameFile)
    .then(sample  => incrementalReducer(result, sample.bitmap.data, scale)
    )
  }
  return result
}
parentPort.on("message", async function(message) {
  if (message === "exit") {
    parentPort.close();
    return;
  }
  const payload = message.payload
  const headers = message.headers
  let result = await sum(payload, headers.scale)
  parentPort.postMessage({ data: result, headers })
  
});

console.log('worker started', workerData)