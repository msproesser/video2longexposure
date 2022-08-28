import Jimp from "jimp";
import { workerData, parentPort, isMainThread } from "worker_threads";
import pureJimpStrategy, {incrementalReducer} from "./steps/merge-frames/pure-jimp-strategy.mjs";

console.log('initing worker', workerData)
// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
parentPort.on("message", async function(message) {
  if (message === "exit") {
    parentPort.close();
    return;
  } 
  const payload = message.payload
  let result = await Jimp.read(payload.pop()).then(sample => [...sample.bitmap.data]);
  
  for (const frameFile of payload) {
    result = await Jimp.read(frameFile)
    .then(sample  => incrementalReducer(result, [...sample.bitmap.data])
    )
  }
  parentPort.postMessage({ data: result, headers: message.headers })
  
});

console.log('worker started', workerData)