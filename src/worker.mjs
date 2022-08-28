import Jimp from "jimp";
import { workerData, parentPort, isMainThread } from "worker_threads";
import pureJimpStrategy, {incrementalReducer} from "./steps/merge-frames/pure-jimp-strategy.mjs";

async function sum(payload) {
  let result = await Jimp.read(payload.pop()).then(sample => [...sample.bitmap.data]);
  
  for (const frameFile of payload) {
    console.log(workerData, frameFile)
    result = await Jimp.read(frameFile)
    .then(sample  => incrementalReducer(result, [...sample.bitmap.data])
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
  let result = await sum(payload)
  parentPort.postMessage({ data: result, headers })
  
});

console.log('worker started', workerData)