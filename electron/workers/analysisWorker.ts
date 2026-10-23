import { parentPort } from 'worker_threads';
import { DeterministicAnalysisEngine, ImageAnalysisResult } from '../services/imageAnalysisEngine';
import { PhotoMetadataRecord } from '../database/schema';

export interface AnalysisJob {
  photoId: string;
  imagePath: string;
  metadata?: PhotoMetadataRecord | null;
}

export interface AnalysisWorkerResult {
  photoId: string;
  success: boolean;
  result?: ImageAnalysisResult;
  error?: string;
}

const engine = new DeterministicAnalysisEngine();

if (parentPort) {
  parentPort.on('message', async (job: AnalysisJob) => {
    try {
      const result = await engine.analyzeImage(job.photoId, job.imagePath, job.metadata);
      const workerResult: AnalysisWorkerResult = {
        photoId: job.photoId,
        success: true,
        result
      };
      parentPort?.postMessage(workerResult);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const workerResult: AnalysisWorkerResult = {
        photoId: job.photoId,
        success: false,
        error: errorMsg
      };
      parentPort?.postMessage(workerResult);
    }
  });
}
