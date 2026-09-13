/**
 * Categoric AI - Client-Side TypeScript Interfaces
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'user' | 'creator' | 'admin';
  plan_id: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface CreditWallet {
  id: string;
  user_id: string;
  balance: number;
  lifetime_granted: number;
  lifetime_consumed: number;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  monthly_credits: number;
  price_usd: number;
  max_resolution: string;
  concurrent_jobs: number;
  features: string[];
  is_active: boolean;
}

export interface GenerationJob {
  id: string;
  user_id: string;
  project_id?: string;
  provider: string;
  model_id: string;
  operation_name?: string;
  mode: 'text-to-video' | 'image-to-video' | 'reference-video' | 'interpolate' | 'extend';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  prompt: string;
  enhanced_prompt?: string;
  negative_prompt?: string;
  aspect_ratio: '16:9' | '9:16';
  resolution: '720p' | '1080p' | '4k';
  duration_seconds: number;
  credits_cost: number;
  input_image_url?: string;
  end_image_url?: string;
  reference_images?: string[];
  camera_movement?: string;
  lens?: string;
  visual_style?: string;
  audio_description?: string;
  dialogue?: string;
  error_message?: string;
  retry_count: number;
  output?: GenerationOutput | null;
  isFavorite?: boolean;
  created_at: string;
  completed_at?: string;
}

export interface GenerationOutput {
  id: string;
  job_id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds: number;
  resolution: string;
  aspect_ratio: string;
  file_size?: number;
  has_audio: boolean;
  download_count: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  videoCount?: number;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  user_id: string;
  project_id?: string;
  name: string;
  category: 'characters' | 'products' | 'brands' | 'backgrounds' | 'other';
  mime_type: string;
  file_size: number;
  url: string;
  created_at: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  prompt: string;
  negative_prompt?: string;
  aspect_ratio: '16:9' | '9:16';
  style: string;
  camera: string;
  tags: string[];
  is_featured: boolean;
}

export interface CreditTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  type: 'PURCHASE' | 'GENERATION' | 'REFUND' | 'BONUS' | 'ADMIN_ADJUSTMENT' | 'SUBSCRIPTION';
  job_id?: string;
  description: string;
  balance_after: number;
  created_at: string;
}

export interface StoryboardScene {
  sceneNumber: number;
  title: string;
  prompt: string;
  camera: string;
  audio: string;
  duration: number;
}
