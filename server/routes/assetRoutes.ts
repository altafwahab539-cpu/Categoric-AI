/**
 * Categoric AI - Media Assets API
 * Manages character, product, brand, and background reference assets.
 */
import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db, MediaAsset } from '../db/index.js';
import { storageProvider } from '../storage/index.js';

const router = Router();

router.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { category, projectId } = req.query;

  let assets = Array.from(db.media_assets.values())
    .filter(a => a.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (category && typeof category === 'string') {
    assets = assets.filter(a => a.category === category);
  }

  if (projectId && typeof projectId === 'string') {
    assets = assets.filter(a => a.project_id === projectId);
  }

  res.json({ assets });
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { name, category = 'other', dataUrl, projectId } = req.body;

    if (!name || !dataUrl) {
      return res.status(400).json({ error: 'Asset name and image data are required.' });
    }

    let buffer: Buffer;
    let mimeType = 'image/jpeg';

    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      mimeType = parts[0].split(';')[0].split(':')[1];
      buffer = Buffer.from(parts[1], 'base64');
    } else {
      buffer = Buffer.from(dataUrl);
    }

    const saved = await storageProvider.saveFile(buffer, `${name}.jpg`, mimeType);

    const assetId = crypto.randomUUID();
    const newAsset: MediaAsset = {
      id: assetId,
      user_id: user.id,
      project_id: projectId || undefined,
      name: name.trim(),
      category: category as any,
      mime_type: mimeType,
      file_size: buffer.length,
      storage_path: saved.path,
      url: dataUrl.startsWith('data:') ? dataUrl : saved.url,
      created_at: new Date().toISOString()
    };

    db.media_assets.set(assetId, newAsset);
    db.save();

    res.status(201).json({ asset: newAsset });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save asset.' });
  }
});

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const asset = db.media_assets.get(req.params.id);

  if (!asset || asset.user_id !== user.id) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  await storageProvider.deleteFile(asset.storage_path);
  db.media_assets.delete(asset.id);
  db.save();

  res.json({ success: true, message: 'Asset deleted.' });
});

export default router;
