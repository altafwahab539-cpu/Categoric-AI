/**
 * Categoric AI - Video Generation & Management Endpoints
 * Supports Text-to-Video, Image-to-Video, Multi-Reference Consistency,
 * First-to-Last Frame, Video Extension, Prompt Enhancer, and Secure Streaming.
 */
import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthenticatedRequest, rateLimiter } from '../middleware/auth.js';
import { db, GenerationJob } from '../db/index.js';
import { VIDEO_MODELS, SYSTEM_LIMITS } from '../config.js';
import { videoQueueService } from '../services/queueService.js';
import { promptEnhancerService } from '../services/promptEnhancerService.js';
import { storageProvider } from '../storage/index.js';

const router = Router();

// Calculate server-authoritative credit cost
function calculateCreditCost(modelId: string, resolution: string, isExtension = false): number {
  const modelConfig = VIDEO_MODELS[modelId] || VIDEO_MODELS.veo_3_1;
  let cost = modelConfig.creditCost;

  if (resolution === '4k') {
    cost = Math.round(cost * 1.8);
  }
  if (isExtension) {
    cost = Math.round(cost * 0.9);
  }
  return cost;
}

/**
 * 1. Enhance Prompt with Gemini
 */
router.post('/enhance-prompt', authenticate, rateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input = req.body;
    if (!input.rawPrompt && !input.subject) {
      return res.status(400).json({ error: 'Please provide a prompt or subject to enhance.' });
    }

    const enhanced = await promptEnhancerService.enhancePrompt(input);
    res.json(enhanced);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to enhance prompt.' });
  }
});

/**
 * 2. Generate Video (Text-to-Video, Image-to-Video, Reference, Interpolation)
 */
router.post('/generate', authenticate, rateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      prompt,
      enhancedPrompt,
      negativePrompt,
      modelId = 'veo_3_1',
      aspectRatio = '16:9',
      resolution = '720p',
      durationSeconds = 6,
      inputImageUrl,
      endImageUrl,
      referenceImages,
      cameraMovement,
      lens,
      visualStyle,
      audioDescription,
      dialogue,
      projectId,
      mode = 'text-to-video'
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'A video prompt is required.' });
    }

    if (prompt.length > SYSTEM_LIMITS.MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: `Prompt exceeds maximum length of ${SYSTEM_LIMITS.MAX_PROMPT_LENGTH} characters.`
      });
    }

    // Validate active concurrent jobs
    const userActiveJobs = Array.from(db.generation_jobs.values()).filter(
      j => j.user_id === user.id && (j.status === 'QUEUED' || j.status === 'PROCESSING')
    );
    if (userActiveJobs.length >= SYSTEM_LIMITS.MAX_CONCURRENT_JOBS_PER_USER) {
      return res.status(429).json({
        error: `You currently have ${userActiveJobs.length} active generation jobs. Please wait for one to finish.`
      });
    }

    // 1. Calculate credit cost strictly on server
    const creditCost = calculateCreditCost(modelId, resolution);

    // 2. Create Job ID
    const jobId = crypto.randomUUID();

    // 3. Atomically reserve credits
    const deductResult = db.deductCreditsAtomic(
      user.id,
      creditCost,
      jobId,
      `Video generation: ${prompt.slice(0, 30)}... (${modelId}, ${resolution})`
    );

    if (!deductResult.success) {
      return res.status(402).json({
        error: deductResult.error || 'Insufficient credits to generate this video.',
        requiredCredits: creditCost
      });
    }

    // 4. Save Job in DB
    const newJob: GenerationJob = {
      id: jobId,
      user_id: user.id,
      project_id: projectId || undefined,
      provider: 'google',
      model_id: modelId,
      mode,
      status: 'QUEUED',
      prompt: prompt.trim(),
      enhanced_prompt: enhancedPrompt ? enhancedPrompt.trim() : undefined,
      negative_prompt: negativePrompt ? negativePrompt.trim() : undefined,
      aspect_ratio: aspectRatio,
      resolution: resolution,
      duration_seconds: durationSeconds,
      credits_cost: creditCost,
      input_image_url: inputImageUrl,
      end_image_url: endImageUrl,
      reference_images: referenceImages,
      camera_movement: cameraMovement,
      lens: lens,
      visual_style: visualStyle,
      audio_description: audioDescription,
      dialogue: dialogue,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.generation_jobs.set(jobId, newJob);
    db.save();

    // 5. Submit to Asynchronous Queue
    await videoQueueService.enqueueJob(jobId);

    // 6. Return response immediately without waiting for Veo
    res.status(202).json({
      message: 'Video generation job queued successfully.',
      job: newJob,
      creditsDeducted: creditCost,
      newBalance: deductResult.newBalance
    });
  } catch (err: any) {
    console.error('[VideoRoutes] Generation error:', err);
    res.status(500).json({ error: err.message || 'Server error creating generation job.' });
  }
});

/**
 * 3. Extend Previously Generated Video
 */
router.post('/extend', authenticate, rateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { videoId, prompt } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID to extend is required.' });
    }

    const previousJob = db.generation_jobs.get(videoId);
    if (!previousJob || previousJob.user_id !== user.id) {
      return res.status(404).json({ error: 'Source video not found or unauthorized.' });
    }

    const creditCost = calculateCreditCost('veo_3_1', '720p', true);
    const newJobId = crypto.randomUUID();

    const deductResult = db.deductCreditsAtomic(
      user.id,
      creditCost,
      newJobId,
      `Video Extension: 7s continuation of scene`
    );

    if (!deductResult.success) {
      return res.status(402).json({ error: deductResult.error });
    }

    const extensionJob: GenerationJob = {
      id: newJobId,
      user_id: user.id,
      project_id: previousJob.project_id,
      provider: 'google',
      model_id: 'veo_3_1',
      mode: 'extend',
      status: 'QUEUED',
      prompt: prompt || `Extend previous scene: ${previousJob.prompt}`,
      aspect_ratio: previousJob.aspect_ratio,
      resolution: '720p',
      duration_seconds: 7,
      credits_cost: creditCost,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.generation_jobs.set(newJobId, extensionJob);
    db.save();

    await videoQueueService.enqueueJob(newJobId);

    res.status(202).json({
      message: 'Video extension job queued.',
      job: extensionJob,
      creditsDeducted: creditCost,
      newBalance: deductResult.newBalance
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. Poll Job Status
 */
router.get('/jobs/:id/status', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const jobId = req.params.id;

  const job = db.generation_jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Generation job not found.' });
  }

  // Strict ownership enforcement
  if (job.user_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. You do not own this job.' });
  }

  const output = Array.from(db.generation_outputs.values()).find(o => o.job_id === job.id);

  res.json({
    job,
    output: output || null
  });
});

/**
 * 5. Get User's Generation Library (Paginated, Searchable, Filterable)
 */
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { projectId, status, search, favoritesOnly, page = '1', limit = '12' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(SYSTEM_LIMITS.MAX_PAGE_SIZE, parseInt(limit as string, 10) || 12);

  let jobs = Array.from(db.generation_jobs.values())
    .filter(j => j.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (projectId) {
    jobs = jobs.filter(j => j.project_id === projectId);
  }

  if (status) {
    jobs = jobs.filter(j => j.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    jobs = jobs.filter(j => j.prompt.toLowerCase().includes(q) || j.model_id.toLowerCase().includes(q));
  }

  if (favoritesOnly === 'true') {
    const userFavs = new Set(
      Array.from(db.favorites.values())
        .filter(f => f.user_id === user.id)
        .map(f => f.job_id)
    );
    jobs = jobs.filter(j => userFavs.has(j.id));
  }

  const total = jobs.length;
  const paginated = jobs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Attach outputs and favorite status
  const userFavs = new Set(
    Array.from(db.favorites.values())
      .filter(f => f.user_id === user.id)
      .map(f => f.job_id)
  );

  const results = paginated.map(job => {
    const output = Array.from(db.generation_outputs.values()).find(o => o.job_id === job.id);
    return {
      ...job,
      output: output || null,
      isFavorite: userFavs.has(job.id)
    };
  });

  res.json({
    videos: results,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * 6. Get Single Video Details
 */
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const job = db.generation_jobs.get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  if (job.user_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const output = Array.from(db.generation_outputs.values()).find(o => o.job_id === job.id);
  const isFav = Array.from(db.favorites.values()).some(f => f.user_id === user.id && f.job_id === job.id);

  res.json({
    video: {
      ...job,
      output: output || null,
      isFavorite: isFav
    }
  });
});

/**
 * 7. Delete Video Generation
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const job = db.generation_jobs.get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  if (job.user_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to delete this video.' });
  }

  // Delete output from storage
  const output = Array.from(db.generation_outputs.values()).find(o => o.job_id === job.id);
  if (output) {
    const filename = output.video_url.split('/').pop();
    if (filename) {
      await storageProvider.deleteFile(filename);
    }
    db.generation_outputs.delete(output.id);
  }

  // Delete job & favorites
  db.generation_jobs.delete(job.id);
  for (const [fid, fav] of db.favorites.entries()) {
    if (fav.job_id === job.id) db.favorites.delete(fid);
  }
  for (const [sid, sh] of db.share_links.entries()) {
    if (sh.job_id === job.id) db.share_links.delete(sid);
  }

  db.save();
  res.json({ success: true, message: 'Video generation deleted.' });
});

/**
 * 8. Toggle Favorite
 */
router.post('/:id/favorite', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const jobId = req.params.id;

  const job = db.generation_jobs.get(jobId);
  if (!job || job.user_id !== user.id) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const existingFav = Array.from(db.favorites.values()).find(
    f => f.user_id === user.id && f.job_id === jobId
  );

  if (existingFav) {
    db.favorites.delete(existingFav.id);
    db.save();
    return res.json({ isFavorite: false });
  } else {
    const favId = crypto.randomUUID();
    db.favorites.set(favId, {
      id: favId,
      user_id: user.id,
      job_id: jobId,
      created_at: new Date().toISOString()
    });
    db.save();
    return res.json({ isFavorite: true });
  }
});

/**
 * 9. Create / Manage Share Link
 */
router.post('/:id/share', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const jobId = req.params.id;
  const { privacy = 'unlisted' } = req.body;

  const job = db.generation_jobs.get(jobId);
  if (!job || job.user_id !== user.id) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  let share = Array.from(db.share_links.values()).find(s => s.job_id === jobId);

  if (!share) {
    const shareToken = crypto.randomBytes(12).toString('hex');
    share = {
      id: crypto.randomUUID(),
      job_id: jobId,
      user_id: user.id,
      share_token: shareToken,
      privacy: privacy as any,
      views_count: 0,
      created_at: new Date().toISOString()
    };
    db.share_links.set(share.id, share);
  } else {
    share.privacy = privacy as any;
  }

  db.save();
  res.json({
    shareUrl: `/shared/${share.share_token}`,
    shareToken: share.share_token,
    privacy: share.privacy
  });
});

/**
 * 10. Public / Unlisted Shared Video View
 */
router.get('/share/:token', (req, res) => {
  const token = req.params.token;
  const share = Array.from(db.share_links.values()).find(s => s.share_token === token);

  if (!share || share.privacy === 'private') {
    return res.status(404).json({ error: 'Shared video is private or does not exist.' });
  }

  const job = db.generation_jobs.get(share.job_id);
  if (!job) {
    return res.status(404).json({ error: 'Associated generation not found.' });
  }

  const output = Array.from(db.generation_outputs.values()).find(o => o.job_id === job.id);
  share.views_count++;
  db.save();

  res.json({
    video: {
      id: job.id,
      prompt: job.prompt,
      model: job.model_id,
      aspectRatio: job.aspect_ratio,
      resolution: job.resolution,
      duration: job.duration_seconds,
      videoUrl: output?.video_url,
      createdAt: job.created_at,
      views: share.views_count
    }
  });
});

/**
 * 11. Secure Video Streaming Endpoint
 */
router.get('/stream/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    const stream = storageProvider.getStream(filename);
    stream.pipe(res);
  } catch (err: any) {
    res.status(404).json({ error: 'Video file stream not found.' });
  }
});

export default router;
