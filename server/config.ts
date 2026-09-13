/**
 * Categoric AI - Central Video Generation & System Configuration
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'google';
  model: string;
  description: string;
  creditCost: number;
  badge?: string;
  supports4K: boolean;
  supportsExtension: boolean;
  supportsReferenceImages: boolean;
  supportsInterpolation: boolean;
  maxDuration: number;
  availableResolutions: ('720p' | '1080p' | '4k')[];
  availableAspectRatios: ('16:9' | '9:16')[];
}

export const VIDEO_MODELS: Record<string, ModelConfig> = {
  veo_3_1: {
    id: 'veo_3_1',
    name: 'Veo 3.1 Cinematic Standard',
    provider: 'google',
    model: 'veo-3.1-generate-preview',
    description: 'Highest visual fidelity, physically accurate lighting, supports 4K, video extension, and reference assets.',
    creditCost: 40,
    badge: 'Pro Quality',
    supports4K: true,
    supportsExtension: true,
    supportsReferenceImages: true,
    supportsInterpolation: true,
    maxDuration: 8,
    availableResolutions: ['720p', '1080p', '4k'],
    availableAspectRatios: ['16:9', '9:16']
  },
  veo_3_1_fast: {
    id: 'veo_3_1_fast',
    name: 'Veo 3.1 Fast Turbo',
    provider: 'google',
    model: 'veo-3.1-fast-generate-preview',
    description: 'Accelerated generation speed, ideal for rapid creative iteration and social content.',
    creditCost: 25,
    badge: 'Fastest',
    supports4K: false,
    supportsExtension: false,
    supportsReferenceImages: false,
    supportsInterpolation: true,
    maxDuration: 6,
    availableResolutions: ['720p', '1080p'],
    availableAspectRatios: ['16:9', '9:16']
  },
  veo_3_1_lite: {
    id: 'veo_3_1_lite',
    name: 'Veo 3.1 Lite Efficient',
    provider: 'google',
    model: 'veo-3.1-lite-generate-preview',
    description: 'Cost-effective generation for storyboard drafting, concepts, and high-volume prototyping.',
    creditCost: 15,
    badge: 'Cost Saver',
    supports4K: false,
    supportsExtension: false,
    supportsReferenceImages: false,
    supportsInterpolation: true,
    maxDuration: 6,
    availableResolutions: ['720p', '1080p'],
    availableAspectRatios: ['16:9', '9:16']
  }
};

// System Limits and Policies
export const SYSTEM_LIMITS = {
  MAX_PROMPT_LENGTH: 2000,
  MAX_NEGATIVE_PROMPT_LENGTH: 800,
  MAX_UPLOAD_SIZE_BYTES: 25 * 1024 * 1024, // 25MB
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_REFERENCE_IMAGES: 3,
  MAX_CONCURRENT_JOBS_PER_USER: 3,
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
  RATE_LIMIT_PER_MINUTE: 30,
  JOB_POLL_INTERVAL_MS: 3000,
  MAX_JOB_WAIT_TIME_MS: 600000 // 10 minutes
};

// Server Environment Config
export const SERVER_CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'categoric_ai_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: '7d',
  STORAGE_DIR: process.env.STORAGE_DIR || './storage_data',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  APP_URL: process.env.APP_URL || 'http://localhost:3000'
};
