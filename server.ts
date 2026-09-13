/**
 * Categoric AI - Production Full-Stack Server
 * Integrates Express API, Google Veo 3.1 & Gemini API engine,
 * async job queue, and Vite middleware.
 */
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import Route Handlers
import authRoutes from './server/routes/authRoutes.js';
import videoRoutes from './server/routes/videoRoutes.js';
import projectRoutes from './server/routes/projectRoutes.js';
import assetRoutes from './server/routes/assetRoutes.js';
import creditRoutes from './server/routes/creditRoutes.js';
import billingRoutes from './server/routes/billingRoutes.js';
import storyboardRoutes from './server/routes/storyboardRoutes.js';
import templateRoutes from './server/routes/templateRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // High body size limit for base64 image reference uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'Categoric AI',
      veoModelsAvailable: true,
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/assets', assetRoutes);
  app.use('/api/credits', creditRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/storyboard', storyboardRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/admin', adminRoutes);

  // Error handling middleware for API routes
  app.use('/api/*', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Error]', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error occurred.'
    });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(` Categoric AI Studio running on http://0.0.0.0:${PORT}`);
    console.log(` Powered by Google Veo 3.1 & Gemini API Engine`);
    console.log(`=================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
