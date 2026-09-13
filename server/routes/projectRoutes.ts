/**
 * Categoric AI - Projects API
 */
import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db, Project } from '../db/index.js';

const router = Router();

router.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const userProjects = Array.from(db.projects.values())
    .filter(p => p.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Attach video count
  const withStats = userProjects.map(proj => {
    const videoCount = Array.from(db.generation_jobs.values()).filter(j => j.project_id === proj.id).length;
    return {
      ...proj,
      videoCount
    };
  });

  res.json({ projects: withStats });
});

router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { name, description, thumbnailUrl } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Project name is required.' });
  }

  const projId = crypto.randomUUID();
  const newProject: Project = {
    id: projId,
    user_id: user.id,
    name: name.trim(),
    description: description?.trim(),
    thumbnail_url: thumbnailUrl,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.projects.set(projId, newProject);
  db.save();

  res.status(201).json({ project: newProject });
});

router.get('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const proj = db.projects.get(req.params.id);

  if (!proj || proj.user_id !== user.id) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const videos = Array.from(db.generation_jobs.values())
    .filter(j => j.project_id === proj.id)
    .map(j => {
      const output = Array.from(db.generation_outputs.values()).find(o => o.job_id === j.id);
      return { ...j, output: output || null };
    });

  res.json({
    project: proj,
    videos
  });
});

router.delete('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const proj = db.projects.get(req.params.id);

  if (!proj || proj.user_id !== user.id) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  db.projects.delete(proj.id);
  // Unlink jobs from project
  for (const job of db.generation_jobs.values()) {
    if (job.project_id === proj.id) {
      job.project_id = undefined;
    }
  }

  db.save();
  res.json({ success: true, message: 'Project deleted.' });
});

export default router;
