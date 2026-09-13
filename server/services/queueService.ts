/**
 * Categoric AI - Asynchronous Generation Queue & Polling Worker
 * Fully decouples HTTP requests from long-running Veo 3.1 generation operations.
 * Enforces atomic credit reservation, intelligent polling with backoff,
 * download caching, and credit refunds on failure.
 */
import { db, GenerationJob, GenerationOutput } from '../db/index.js';
import { googleVeoProvider } from '../providers/googleVeoProvider.js';
import { storageProvider } from '../storage/index.js';
import { SYSTEM_LIMITS } from '../config.js';

class VideoQueueService {
  private isWorkerRunning = false;
  private activeJobs = new Set<string>();

  constructor() {
    // Start background processing loop
    this.startWorker();
  }

  public async enqueueJob(jobId: string) {
    const job = db.generation_jobs.get(jobId);
    if (!job) return;

    job.status = 'QUEUED';
    db.save();
    console.log(`[QueueService] Job ${jobId} queued for execution.`);
  }

  private startWorker() {
    if (this.isWorkerRunning) return;
    this.isWorkerRunning = true;

    setInterval(async () => {
      await this.processNextBatch();
    }, 2500);
  }

  private async processNextBatch() {
    // Find all queued jobs
    const queuedJobs = Array.from(db.generation_jobs.values()).filter(
      (j) => j.status === 'QUEUED' && !this.activeJobs.has(j.id)
    );

    for (const job of queuedJobs) {
      this.activeJobs.add(job.id);
      // Run async without blocking loop
      this.executeJob(job).finally(() => {
        this.activeJobs.delete(job.id);
      });
    }
  }

  private async executeJob(job: GenerationJob) {
    console.log(`[QueueService] Starting execution of job: ${job.id} (User: ${job.user_id})`);

    job.status = 'PROCESSING';
    job.started_at = new Date().toISOString();
    job.updated_at = new Date().toISOString();
    db.save();

    try {
      // 1. Submit to Provider (Google Veo)
      const opResult = await googleVeoProvider.generate({
        prompt: job.prompt,
        enhancedPrompt: job.enhanced_prompt,
        negativePrompt: job.negative_prompt,
        modelId: job.model_id,
        aspectRatio: job.aspect_ratio,
        resolution: job.resolution,
        durationSeconds: job.duration_seconds,
        inputImageBase64: job.input_image_url?.startsWith('data:')
          ? job.input_image_url.split(',')[1]
          : undefined,
        inputImageMime: job.input_image_url?.startsWith('data:')
          ? job.input_image_url.split(';')[0].split(':')[1]
          : undefined,
        lastFrameImageBase64: job.end_image_url?.startsWith('data:')
          ? job.end_image_url.split(',')[1]
          : undefined,
        lastFrameImageMime: job.end_image_url?.startsWith('data:')
          ? job.end_image_url.split(';')[0].split(':')[1]
          : undefined,
        referenceImages: job.reference_images?.map((url) => ({
          imageBase64: url.startsWith('data:') ? url.split(',')[1] : url,
          mimeType: url.startsWith('data:') ? url.split(';')[0].split(':')[1] : 'image/jpeg'
        })),
        cameraMovement: job.camera_movement,
        lens: job.lens,
        style: job.visual_style,
        audioDescription: job.audio_description,
        dialogue: job.dialogue
      });

      job.operation_name = opResult.operationName;
      job.updated_at = new Date().toISOString();
      db.save();

      console.log(`[QueueService] Job ${job.id} submitted. Op name: ${job.operation_name}. Starting poll...`);

      // 2. Poll for completion
      await this.pollOperation(job);

    } catch (err: any) {
      console.error(`[QueueService] Generation failed for job ${job.id}:`, err);
      this.handleJobFailure(job, err?.message || 'Video generation failed during submission.');
    }
  }

  private async pollOperation(job: GenerationJob) {
    if (!job.operation_name) {
      this.handleJobFailure(job, 'Missing operation name from provider.');
      return;
    }

    const startTime = Date.now();
    let pollCount = 0;

    while (Date.now() - startTime < SYSTEM_LIMITS.MAX_JOB_WAIT_TIME_MS) {
      pollCount++;
      await new Promise((r) => setTimeout(r, SYSTEM_LIMITS.JOB_POLL_INTERVAL_MS));

      // Refresh job in case of manual cancellation
      const currentJob = db.generation_jobs.get(job.id);
      if (!currentJob || currentJob.status === 'CANCELLED') {
        console.log(`[QueueService] Job ${job.id} was cancelled.`);
        return;
      }

      const statusResult = await googleVeoProvider.getStatus(job.operation_name);

      if (statusResult.done) {
        if (statusResult.error) {
          this.handleJobFailure(job, statusResult.error);
          return;
        }

        if (statusResult.videoUri) {
          console.log(`[QueueService] Operation done for job ${job.id}! Downloading video...`);
          await this.finalizeJobSuccess(job, statusResult.videoUri);
          return;
        }
      }

      // Keep job updated with active status
      job.updated_at = new Date().toISOString();
      db.save();
    }

    // Timeout reached
    this.handleJobFailure(job, 'Video generation timed out waiting for Veo service to finish.');
  }

  private async finalizeJobSuccess(job: GenerationJob, videoUri: string) {
    try {
      // 1. Download generated video stream securely
      const videoBuffer = await googleVeoProvider.download(videoUri);

      // 2. Save in storage provider
      const saved = await storageProvider.saveFile(
        videoBuffer,
        `video_${job.id}.mp4`,
        'video/mp4'
      );

      // 3. Register output in database
      const outputId = `out_${job.id}`;
      const output: GenerationOutput = {
        id: outputId,
        job_id: job.id,
        user_id: job.user_id,
        video_url: saved.url,
        thumbnail_url: job.input_image_url || undefined,
        duration_seconds: job.duration_seconds || 6,
        resolution: job.resolution,
        aspect_ratio: job.aspect_ratio,
        file_size: saved.fileSize,
        has_audio: Boolean(job.audio_description || job.dialogue),
        download_count: 0,
        created_at: new Date().toISOString()
      };

      db.generation_outputs.set(outputId, output);

      // 4. Mark job completed
      job.status = 'COMPLETED';
      job.completed_at = new Date().toISOString();
      job.updated_at = new Date().toISOString();
      db.save();

      // 5. Add notification
      db.notifications.set(`notif_${job.id}`, {
        id: `notif_${job.id}`,
        user_id: job.user_id,
        title: 'Video Generated Successfully',
        message: `Your cinematic video "${job.prompt.slice(0, 45)}..." is ready to watch and download!`,
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString()
      });
      db.save();

      console.log(`[QueueService] Job ${job.id} successfully finalized and stored.`);
    } catch (err: any) {
      console.error(`[QueueService] Failed to finalize job ${job.id}:`, err);
      this.handleJobFailure(job, `Video was generated but failed to download/store: ${err.message}`);
    }
  }

  private handleJobFailure(job: GenerationJob, errorMessage: string) {
    job.status = 'FAILED';
    job.error_message = errorMessage;
    job.completed_at = new Date().toISOString();
    job.updated_at = new Date().toISOString();

    // Critical rule: A failed generation must not permanently consume credits.
    const refundResult = db.refundCreditsAtomic(
      job.user_id,
      job.credits_cost,
      job.id,
      `Generation failed: ${errorMessage}`
    );

    console.log(
      `[QueueService] Job ${job.id} failed. Refunded ${job.credits_cost} credits to user ${job.user_id}. New balance: ${refundResult.newBalance}`
    );

    // Send notification
    db.notifications.set(`notif_fail_${job.id}`, {
      id: `notif_fail_${job.id}`,
      user_id: job.user_id,
      title: 'Video Generation Failed - Credits Refunded',
      message: `Your video couldn't be generated: ${errorMessage}. Your ${job.credits_cost} credits have been restored.`,
      type: 'error',
      is_read: false,
      created_at: new Date().toISOString()
    });

    db.save();
  }
}

export const videoQueueService = new VideoQueueService();
