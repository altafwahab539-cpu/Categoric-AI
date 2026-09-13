/**
 * Categoric AI - Credit Wallet & Transaction History
 */
import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db/index.js';

const router = Router();

router.get('/balance', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let wallet = db.credit_wallets.get(user.id);

  if (!wallet) {
    wallet = {
      id: user.id,
      user_id: user.id,
      balance: 100,
      lifetime_granted: 100,
      lifetime_consumed: 0,
      updated_at: new Date().toISOString()
    };
    db.credit_wallets.set(user.id, wallet);
    db.save();
  }

  res.json({
    wallet,
    plan: db.plans.get(user.plan_id) || null
  });
});

router.get('/transactions', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const txs = Array.from(db.credit_transactions.values())
    .filter(t => t.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);

  res.json({ transactions: txs });
});

export default router;
