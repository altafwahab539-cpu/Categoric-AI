/**
 * Categoric AI - Templates API
 */
import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const { category } = req.query;
  let templates = Array.from(db.prompt_templates.values());

  if (category && typeof category === 'string' && category !== 'All') {
    templates = templates.filter(t => t.category.toLowerCase().includes(category.toLowerCase()));
  }

  res.json({ templates });
});

export default router;
