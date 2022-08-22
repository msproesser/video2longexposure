import { workerData, parentPort, isMainThread } from "worker_threads";
import pairMergeStrategy from './sampleMergeStrategies/pair-merge-strategy.mjs'

// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
parentPort.on("message", message => {
  if (message === "exit") {
    parentPort.postMessage("sold!");
    parentPort.close();
  } else {
      pairMergeStrategy(message.message)
      .then(result => parentPort.postMessage({ data: result, headers: message.headers }))
      .catch(console.log)
  }
});

console.log('worker started', workerData)