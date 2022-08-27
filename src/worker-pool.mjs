import { Worker } from "worker_threads";

class WorkerWrap {
    #messageIdCounter = 0
    #idResultMap = new Map()
    #worker
    #free = true
    constructor(id) {
        this.#worker = new Worker('./src/worker.mjs', { workerData: 'worker-' + id });
        this.#worker.on("error", code => new Error(`Worker[worker-${id}] error with exit code ${code}`));
        this.#worker.on("exit", code => console.log(`Worker[worker-${id}] stopped with exit code ${code}`));
        this.#worker.on('message', result => {
            this.#free = true;
            const feedbackFn = this.#idResultMap.get(result.headers.id)
            feedbackFn && feedbackFn(result.data)
            this.#idResultMap.delete(result.headers.id)
        })
    }
    isFree() {
        return this.#free
    }
    send(payload) {
        const id = this.#messageIdCounter++
        const pack = { payload, headers: {id} }
        this.#free = false;
        this.#worker.postMessage(pack)
        return new Promise((res, err) => {
            this.#idResultMap.set(id, data => res(data))
        })
    }
}

export default class WorkerPool {
    #workers = []
    #messageQueue = []
    #quantity = 4
    constructor(quantity = 4) {
        console.log('pool size of', quantity)
        this.#quantity = quantity
        for (let i = 0; i < quantity; i++) {
            this.#workers.push(new WorkerWrap(i))
        }
        setInterval(() => {
            const worker = this.#getFree()
            if (this.#messageQueue.length > 0 && worker) {
                const message = this.#messageQueue.shift()
                
                worker.send(message.data).then(cb => message.callback(cb)).catch(message.err)
            }
        }, 100)
    }

    #getFree() {
        return this.#workers.find(w => w.isFree())
    }

    send(data) {
        return new Promise((callback, err) => {
            this.#messageQueue.push({ data, callback, err });
        })
    }

    poolSize() {
        return this.#quantity
    }
}
