import { Worker, isMainThread } from "worker_threads";

function runService(workerData) {
  const worker = new Worker("./src/worker.mjs", { workerData });
  worker.postMessage({sample: 'object'});
  worker.on("message", incoming => console.log({ incoming }));
  worker.on("error", code => new Error(`Worker error with exit code ${code}`));
  worker.on("exit", code =>
    console.log(`Worker stopped with exit code ${code}`)
  );
  worker.postMessage("twice");
  worker.postMessage("three times");
  worker.postMessage("exit");
  setTimeout(() => worker.postMessage("you won't see me"), 100);
}

function run() {
  const result = runService("let's begin");
  console.log({ isMainThread });
}

run()