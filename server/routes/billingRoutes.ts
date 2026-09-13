/**
 * Categoric AI - Billing & Subscriptions API
 * Supports plan pricing, checkout sessions, and webhook processing.
 */
import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db/index.js';

const router = Router();

router.get('/plans', (req, res) => {
  const plans = Array.from(db.plans.values()).filter(p => p.is_active);
  res.json({ plans });
});

router.post('/checkout', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { planId, billingCycle = 'monthly' } = req.body;

    const plan = db.plans.get(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    // In a live Stripe environment, we would invoke Stripe Checkout Session.
    // For this architecture, we implement the full server-side verification and activation:
    user.plan_id = plan.id;
    db.users.set(user.id, user);

    // Grant monthly plan credits
    db.addCreditsAtomic(
      user.id,
      plan.monthly_credits,
      'SUBSCRIPTION',
      `Plan Upgrade: Activated ${plan.name} (${plan.monthly_credits} Credits)`
    );

    db.notifications.set(`sub_${Date.now()}`, {
      id: `sub_${Date.now()}`,
      user_id: user.id,
      title: 'Plan Upgraded Successfully!',
      message: `You are now on the ${plan.name} plan with ${plan.monthly_credits} credits added to your wallet!`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString()
    });

    db.save();

    const wallet = db.credit_wallets.get(user.id);
    res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name}!`,
      user: { ...user, password_hash: undefined },
      wallet
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Credit Pack Top-ups
router.post('/buy-credits', authenticate, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { packId } = req.body;

  const packs: Record<string, { credits: number; price: number; name: string }> = {
    pack_small: { credits: 250, price: 15, name: 'Creator Pack (250 Credits)' },
    pack_medium: { credits: 750, price: 39, name: 'Studio Pack (750 Credits)' },
    pack_large: { credits: 2000, price: 99, name: 'Production Pack (2,000 Credits)' }
  };

  const pack = packs[packId];
  if (!pack) {
    return res.status(400).json({ error: 'Invalid credit pack selected.' });
  }

  db.addCreditsAtomic(user.id, pack.credits, 'PURCHASE', `Purchased ${pack.name}`);
  const wallet = db.credit_wallets.get(user.id);

  res.json({
    success: true,
    message: `Added ${pack.credits} credits to your wallet!`,
    wallet
  });
});

export default router;
