import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import { ThumbnailJob, ThumbnailResult } from './thumbnailWorker';

interface QueuedTask {
  job: ThumbnailJob;
  resolve: (result: ThumbnailResult) => void;
  reject: (error: Error) => void;
}

interface ManagedWorker {
  id: number;
  worker: Worker;
  busy: boolean;
  currentTask?: QueuedTask;
}

export class WorkerPool {
  private static instance: WorkerPool;
  private workers: ManagedWorker[] = [];
  private taskQueue: QueuedTask[] = [];
  private workerScriptPath: string;
  private concurrency: number;
  private isTerminated: boolean = false;

  private constructor() {
    // Concurrency based on available CPU cores without starving system/UI
    const cpuCount = os.cpus()?.length || 4;
    this.concurrency = Math.max(1, Math.min(cpuCount - 1, 6));

    // Resolve worker script path — workers are always in a 'workers/' subfolder
    // next to main.js. __dirname here is dist-electron/ so we look for workers/thumbnailWorker.js
    const workerSubdir = path.basename(__dirname) === 'workers'
      ? __dirname                                       // already inside workers/
      : path.resolve(__dirname, 'workers');             // from dist-electron/ root
    this.workerScriptPath = path.resolve(workerSubdir, 'thumbnailWorker.js');
    this.initPool();
  }

  public static getInstance(): WorkerPool {
    if (!WorkerPool.instance) {
      WorkerPool.instance = new WorkerPool();
    }
    return WorkerPool.instance;
  }

  private initPool(): void {
    for (let i = 0; i < this.concurrency; i++) {
      this.spawnWorker(i);
    }
  }

  private spawnWorker(id: number): void {
    if (this.isTerminated) return;

    try {
      const worker = new Worker(this.workerScriptPath);
      const managed: ManagedWorker = { id, worker, busy: false };

      worker.on('message', (result: ThumbnailResult) => {
        if (managed.currentTask) {
          managed.currentTask.resolve(result);
          managed.currentTask = undefined;
        }
        managed.busy = false;
        this.processNextTask();
      });

      worker.on('error', (err) => {
        console.error(`[WORKER POOL] Worker ${id} encountered error:`, err);
        if (managed.currentTask) {
          managed.currentTask.reject(err);
          managed.currentTask = undefined;
        }
      });

      worker.on('exit', (code) => {
        if (!this.isTerminated) {
          console.warn(`[WORKER POOL] Worker ${id} exited with code ${code}. Respawning replacement.`);
          const idx = this.workers.findIndex(w => w.id === id);
          if (idx !== -1) {
            this.workers.splice(idx, 1);
          }
          this.spawnWorker(id);
        }
      });

      this.workers.push(managed);
    } catch (err) {
      console.error(`[WORKER POOL] Failed to spawn worker ${id}:`, err);
    }
  }

  public enqueueThumbnailJob(job: ThumbnailJob): Promise<ThumbnailResult> {
    if (this.isTerminated) {
      return Promise.reject(new Error('Worker pool is terminated'));
    }

    return new Promise<ThumbnailResult>((resolve, reject) => {
      this.taskQueue.push({ job, resolve, reject });
      this.processNextTask();
    });
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    availableWorker.busy = true;
    availableWorker.currentTask = task;
    availableWorker.worker.postMessage(task.job);
  }

  public getQueueLength(): number {
    return this.taskQueue.length;
  }

  public getActiveWorkerCount(): number {
    return this.workers.filter(w => w.busy).length;
  }

  public getPoolSize(): number {
    return this.workers.length;
  }

  public async terminate(): Promise<void> {
    this.isTerminated = true;
    this.taskQueue.forEach(t => t.reject(new Error('Worker pool terminated')));
    this.taskQueue = [];
    await Promise.all(this.workers.map(w => w.worker.terminate()));
    this.workers = [];
  }
}
