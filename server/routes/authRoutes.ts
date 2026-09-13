/**
 * Categoric AI - Auth Routes
 */
import { Router } from 'express';
import { authService } from '../services/authService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db/index.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await authService.register(email, password, name);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.post('/social', async (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for social login.' });
    }
    const result = await authService.socialLogin(email, name, avatarUrl);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const wallet = db.credit_wallets.get(user.id);
  const plan = db.plans.get(user.plan_id);

  const { password_hash, ...safeUser } = user;
  res.json({
    user: safeUser,
    wallet: wallet || { balance: 0 },
    plan: plan || null
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
