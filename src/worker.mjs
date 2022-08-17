import { workerData, parentPort, isMainThread } from "worker_threads";

// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
parentPort.on("message", message => {
  if (message === "exit") {
    parentPort.postMessage("sold!");
    parentPort.close();
  } else {
    parentPort.postMessage({ going: message });
  }
});

parentPort.postMessage({ start: workerData, isMainThread });
console.log('worker starteds')