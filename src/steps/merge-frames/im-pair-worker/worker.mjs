import { workerData, parentPort } from "worker_threads";
import {pairMerge} from './pair-merge-strategy.mjs'

// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
parentPort.on("message", message => {
  if (message === "exit") {
    parentPort.close();
  } else {
      pairMerge(message.payload)
      .then(result => parentPort.postMessage({ data: result, headers: message.headers }))
      .catch(console.log)
  }
});

console.log('worker started', workerData)