/**
 * Categoric AI - Admin & Telemetry Dashboard API
 * Centralized governance: Metrics, Job Queue Inspector, User Management,
 * Dynamic Model Pricing Configuration, and Failure Diagnosis.
 */
import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { VIDEO_MODELS } from '../config.js';
import { videoQueueService } from '../services/queueService.js';

const router = Router();

// Apply auth + requireAdmin to all admin endpoints
router.use(authenticate, requireAdmin);

/**
 * 1. Overview Metrics & Telemetry
 */
router.get('/metrics', (req: AuthenticatedRequest, res) => {
  const users = Array.from(db.users.values());
  const jobs = Array.from(db.generation_jobs.values());
  const transactions = Array.from(db.credit_transactions.values());

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const totalGenerations = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
  const failedJobs = jobs.filter(j => j.status === 'FAILED').length;
  const queuedJobs = jobs.filter(j => j.status === 'QUEUED' || j.status === 'PROCESSING').length;

  const totalCreditsGranted = transactions
    .filter(t => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalCreditsSpent = transactions
    .filter(t => t.type === 'GENERATION')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  // Revenue estimation from purchases & subscriptions
  const estimatedRevenue = users.reduce((acc, u) => {
    if (u.plan_id === 'creator') return acc + 29;
    if (u.plan_id === 'pro') return acc + 79;
    if (u.plan_id === 'business') return acc + 249;
    return acc;
  }, 0);

  const successRate = totalGenerations > 0 ? Math.round((completedJobs / totalGenerations) * 100) : 100;

  res.json({
    metrics: {
      totalUsers,
      activeUsers,
      totalGenerations,
      completedJobs,
      failedJobs,
      queuedJobs,
      successRate,
      totalCreditsGranted,
      totalCreditsSpent,
      estimatedRevenue
    }
  });
});

/**
 * 2. User Governance (List, Filter, Details)
 */
router.get('/users', (req: AuthenticatedRequest, res) => {
  const users = Array.from(db.users.values()).map(u => {
    const wallet = db.credit_wallets.get(u.id);
    const videoCount = Array.from(db.generation_jobs.values()).filter(j => j.user_id === u.id).length;
    const { password_hash, ...safeUser } = u;
    return {
      ...safeUser,
      wallet: wallet || { balance: 0 },
      videoCount
    };
  });

  res.json({ users });
});

/**
 * 3. Add or Deduct Credits for User
 */
router.post('/users/:id/credits', (req: AuthenticatedRequest, res) => {
  const targetId = req.params.id;
  const { amount, reason = 'Admin manual adjustment' } = req.body;
  const admin = req.user!;

  if (typeof amount !== 'number' || amount === 0) {
    return res.status(400).json({ error: 'Valid numerical amount is required.' });
  }

  const user = db.users.get(targetId);
  if (!user) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  if (amount > 0) {
    db.addCreditsAtomic(user.id, amount, 'ADMIN_ADJUSTMENT', `Admin credit bonus: ${reason}`);
  } else {
    const abs = Math.abs(amount);
    db.deductCreditsAtomic(user.id, abs, 'admin_adjust', `Admin credit deduction: ${reason}`);
  }

  // Record admin action
  db.admin_actions.set(crypto.randomUUID(), {
    id: crypto.randomUUID(),
    admin_id: admin.id,
    target_user_id: user.id,
    action_type: 'CREDIT_ADJUSTMENT',
    details: { amount, reason },
    created_at: new Date().toISOString()
  });

  db.save();

  const wallet = db.credit_wallets.get(user.id);
  res.json({
    success: true,
    message: `Adjusted user credits by ${amount}. New balance: ${wallet?.balance}`,
    wallet
  });
});

/**
 * 4. Suspend / Activate User Account or Change Plan
 */
router.post('/users/:id/status', (req: AuthenticatedRequest, res) => {
  const targetId = req.params.id;
  const { isActive, planId } = req.body;
  const admin = req.user!;

  const user = db.users.get(targetId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (typeof isActive === 'boolean') {
    user.is_active = isActive;
  }
  if (planId && db.plans.has(planId)) {
    user.plan_id = planId;
  }

  user.updated_at = new Date().toISOString();
  db.users.set(user.id, user);

  db.admin_actions.set(crypto.randomUUID(), {
    id: crypto.randomUUID(),
    admin_id: admin.id,
    target_user_id: user.id,
    action_type: 'USER_STATUS_UPDATE',
    details: { isActive, planId },
    created_at: new Date().toISOString()
  });

  db.save();
  const { password_hash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

/**
 * 5. Generation Jobs Inspector & Failed Jobs
 */
router.get('/jobs', (req: AuthenticatedRequest, res) => {
  const { status, limit = '50' } = req.query;
  let jobs = Array.from(db.generation_jobs.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (status && typeof status === 'string' && status !== 'ALL') {
    jobs = jobs.filter(j => j.status === status);
  }

  const limited = jobs.slice(0, parseInt(limit as string, 10) || 50).map(j => {
    const user = db.users.get(j.user_id);
    const output = Array.from(db.generation_outputs.values()).find(o => o.job_id === j.id);
    return {
      ...j,
      userEmail: user?.email || 'unknown',
      userName: user?.name || 'unknown',
      output: output || null
    };
  });

  res.json({ jobs: limited });
});

/**
 * 6. Retry Failed Job
 */
router.post('/jobs/:id/retry', async (req: AuthenticatedRequest, res) => {
  const job = db.generation_jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  job.status = 'QUEUED';
  job.error_message = undefined;
  job.retry_count = (job.retry_count || 0) + 1;
  job.updated_at = new Date().toISOString();
  db.save();

  await videoQueueService.enqueueJob(job.id);

  res.json({ success: true, message: `Job ${job.id} re-queued for generation.`, job });
});

/**
 * 7. Model Pricing Configuration
 */
router.get('/model-pricing', (req: AuthenticatedRequest, res) => {
  res.json({ models: VIDEO_MODELS });
});

router.post('/model-pricing', (req: AuthenticatedRequest, res) => {
  const { modelId, creditCost } = req.body;
  if (!modelId || typeof creditCost !== 'number' || creditCost <= 0) {
    return res.status(400).json({ error: 'Valid modelId and positive creditCost required.' });
  }

  if (VIDEO_MODELS[modelId]) {
    VIDEO_MODELS[modelId].creditCost = creditCost;
    return res.json({
      success: true,
      message: `Updated ${modelId} credit cost to ${creditCost}`,
      models: VIDEO_MODELS
    });
  }

  res.status(404).json({ error: 'Model ID not found.' });
});

export default router;
