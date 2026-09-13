-- Categoric AI - PostgreSQL Production Database Schema
-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
    plan_id VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. ACCOUNTS (OAuth / Providers)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- 3. SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- 4. PLANS
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_credits INTEGER NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL,
    max_resolution VARCHAR(20) DEFAULT '1080p',
    concurrent_jobs INTEGER DEFAULT 2,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 6. CREDIT WALLETS
CREATE TABLE IF NOT EXISTS credit_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 100 CHECK (balance >= 0),
    lifetime_granted INTEGER NOT NULL DEFAULT 100,
    lifetime_consumed INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_credit_wallets_user ON credit_wallets(user_id);

-- 7. CREDIT TRANSACTIONS
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES credit_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('PURCHASE', 'GENERATION', 'REFUND', 'BONUS', 'ADMIN_ADJUSTMENT', 'SUBSCRIPTION')),
    job_id UUID,
    description TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON credit_transactions(created_at);

-- 8. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- 9. MEDIA ASSETS
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('characters', 'products', 'brands', 'backgrounds', 'other')),
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_assets_user ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_cat ON media_assets(category);

-- 10. PROJECT ASSETS (Many-to-Many linking)
CREATE TABLE IF NOT EXISTS project_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, asset_id)
);

-- 11. GENERATION JOBS
CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    model_id VARCHAR(100) NOT NULL,
    operation_name TEXT,
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('text-to-video', 'image-to-video', 'reference-video', 'interpolate', 'extend')),
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    prompt TEXT NOT NULL,
    enhanced_prompt TEXT,
    negative_prompt TEXT,
    aspect_ratio VARCHAR(20) DEFAULT '16:9',
    resolution VARCHAR(20) DEFAULT '720p',
    duration_seconds INTEGER DEFAULT 6,
    credits_cost INTEGER NOT NULL,
    input_image_url TEXT,
    end_image_url TEXT,
    reference_images JSONB DEFAULT '[]'::jsonb,
    camera_movement VARCHAR(50),
    lens VARCHAR(50),
    visual_style VARCHAR(50),
    audio_description TEXT,
    dialogue TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON generation_jobs(created_at);

-- 12. GENERATION OUTPUTS
CREATE TABLE IF NOT EXISTS generation_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds NUMERIC(5, 2),
    resolution VARCHAR(20),
    aspect_ratio VARCHAR(20),
    file_size BIGINT,
    has_audio BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_outputs_job ON generation_outputs(job_id);
CREATE INDEX IF NOT EXISTS idx_outputs_user ON generation_outputs(user_id);

-- 13. PROMPT TEMPLATES
CREATE TABLE IF NOT EXISTS prompt_templates (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    aspect_ratio VARCHAR(20) DEFAULT '16:9',
    style VARCHAR(100),
    camera VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- 15. SHARE LINKS
CREATE TABLE IF NOT EXISTS share_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_token VARCHAR(100) UNIQUE NOT NULL,
    privacy VARCHAR(50) DEFAULT 'unlisted' CHECK (privacy IN ('private', 'unlisted', 'public')),
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_share_token ON share_links(share_token);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- 17. ADMIN ACTIONS
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
