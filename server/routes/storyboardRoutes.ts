/**
 * Categoric AI - Storyboard & AI Director API
 * Orchestrates multi-scene productions with character, style, and product consistency.
 */
import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { promptEnhancerService } from '../services/promptEnhancerService.js';
import { db, GenerationJob } from '../db/index.js';
import { videoQueueService } from '../services/queueService.js';
import { VIDEO_MODELS } from '../config.js';

const router = Router();

/**
 * 1. AI Director: Generate Storyboard breakdown from raw concept
 */
router.post('/ai-director', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { concept } = req.body;
    if (!concept) {
      return res.status(400).json({ error: 'Please describe the video or commercial concept.' });
    }

    const scenes = await promptEnhancerService.generateStoryboard(concept);
    res.json({ scenes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate storyboard.' });
  }
});

/**
 * 2. Generate All: Queue all scenes in sequence or parallel
 */
router.post('/generate-all', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { projectId, scenes, consistencyReferenceUrl, modelId = 'veo_3_1' } = req.body;

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({ error: 'At least one scene is required.' });
    }

    const modelConfig = VIDEO_MODELS[modelId] || VIDEO_MODELS.veo_3_1;
    const totalCost = scenes.length * modelConfig.creditCost;

    const wallet = db.credit_wallets.get(user.id);
    if (!wallet || wallet.balance < totalCost) {
      return res.status(402).json({
        error: `Insufficient credits for all ${scenes.length} scenes. Required: ${totalCost}, Available: ${wallet?.balance || 0}`
      });
    }

    const queuedJobs: GenerationJob[] = [];

    for (const scene of scenes) {
      const jobId = crypto.randomUUID();
      const deduct = db.deductCreditsAtomic(
        user.id,
        modelConfig.creditCost,
        jobId,
        `Storyboard Scene ${scene.sceneNumber || ''}: ${scene.title || scene.prompt.slice(0, 20)}`
      );

      if (!deduct.success) break;

      const job: GenerationJob = {
        id: jobId,
        user_id: user.id,
        project_id: projectId || undefined,
        provider: 'google',
        model_id: modelId,
        mode: consistencyReferenceUrl ? 'reference-video' : 'text-to-video',
        status: 'QUEUED',
        prompt: scene.prompt,
        aspect_ratio: scene.aspectRatio || '16:9',
        resolution: '720p',
        duration_seconds: scene.duration || 6,
        credits_cost: modelConfig.creditCost,
        reference_images: consistencyReferenceUrl ? [consistencyReferenceUrl] : undefined,
        camera_movement: scene.camera,
        audio_description: scene.audio,
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      db.generation_jobs.set(jobId, job);
      queuedJobs.push(job);

      // Submit to background queue
      await videoQueueService.enqueueJob(jobId);
    }

    db.save();

    res.json({
      message: `Queued ${queuedJobs.length} scenes for production.`,
      jobs: queuedJobs,
      totalCreditsDeducted: queuedJobs.length * modelConfig.creditCost,
      newBalance: db.credit_wallets.get(user.id)?.balance
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
