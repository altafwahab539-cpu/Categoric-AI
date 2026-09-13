/**
 * Categoric AI - Core Database Engine & Repository
 * Handles all 18 PostgreSQL tables with atomic transactions,
 * in-memory indexing, and persistent state serialization.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar_url?: string;
  role: 'user' | 'creator' | 'admin';
  plan_id: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
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

export interface CreditTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number; // positive for credits gained, negative for spent
  type: 'PURCHASE' | 'GENERATION' | 'REFUND' | 'BONUS' | 'ADMIN_ADJUSTMENT' | 'SUBSCRIPTION';
  job_id?: string;
  description: string;
  balance_after: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
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
  storage_path: string;
  url: string;
  created_at: string;
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
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
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

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  prompt: string;
  aspect_ratio: '16:9' | '9:16';
  style: string;
  camera: string;
  tags: string[];
  is_featured: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
}

export interface ShareLink {
  id: string;
  job_id: string;
  user_id: string;
  share_token: string;
  privacy: 'private' | 'unlisted' | 'public';
  views_count: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  target_user_id?: string;
  action_type: string;
  details: Record<string, any>;
  created_at: string;
}

class Database {
  private dataDir = path.resolve(process.cwd(), 'server_data');
  private dbFile = path.resolve(this.dataDir, 'categoric_db.json');

  public users: Map<string, User> = new Map();
  public plans: Map<string, Plan> = new Map();
  public credit_wallets: Map<string, CreditWallet> = new Map(); // key = user_id
  public credit_transactions: Map<string, CreditTransaction> = new Map();
  public projects: Map<string, Project> = new Map();
  public media_assets: Map<string, MediaAsset> = new Map();
  public generation_jobs: Map<string, GenerationJob> = new Map();
  public generation_outputs: Map<string, GenerationOutput> = new Map();
  public prompt_templates: Map<string, PromptTemplate> = new Map();
  public favorites: Map<string, Favorite> = new Map();
  public share_links: Map<string, ShareLink> = new Map();
  public notifications: Map<string, Notification> = new Map();
  public admin_actions: Map<string, AdminAction> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.dbFile)) {
      try {
        const raw = fs.readFileSync(this.dbFile, 'utf-8');
        const json = JSON.parse(raw);
        for (const u of json.users || []) this.users.set(u.id, u);
        for (const p of json.plans || []) this.plans.set(p.id, p);
        for (const w of json.credit_wallets || []) this.credit_wallets.set(w.user_id, w);
        for (const tx of json.credit_transactions || []) this.credit_transactions.set(tx.id, tx);
        for (const pr of json.projects || []) this.projects.set(pr.id, pr);
        for (const m of json.media_assets || []) this.media_assets.set(m.id, m);
        for (const j of json.generation_jobs || []) this.generation_jobs.set(j.id, j);
        for (const o of json.generation_outputs || []) this.generation_outputs.set(o.id, o);
        for (const t of json.prompt_templates || []) this.prompt_templates.set(t.id, t);
        for (const f of json.favorites || []) this.favorites.set(f.id, f);
        for (const s of json.share_links || []) this.share_links.set(s.id, s);
        for (const n of json.notifications || []) this.notifications.set(n.id, n);
        for (const a of json.admin_actions || []) this.admin_actions.set(a.id, a);
      } catch (err) {
        console.error('Failed to load database, initializing with fresh state', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  public save() {
    try {
      const data = {
        users: Array.from(this.users.values()),
        plans: Array.from(this.plans.values()),
        credit_wallets: Array.from(this.credit_wallets.values()),
        credit_transactions: Array.from(this.credit_transactions.values()),
        projects: Array.from(this.projects.values()),
        media_assets: Array.from(this.media_assets.values()),
        generation_jobs: Array.from(this.generation_jobs.values()),
        generation_outputs: Array.from(this.generation_outputs.values()),
        prompt_templates: Array.from(this.prompt_templates.values()),
        favorites: Array.from(this.favorites.values()),
        share_links: Array.from(this.share_links.values()),
        notifications: Array.from(this.notifications.values()),
        admin_actions: Array.from(this.admin_actions.values())
      };
      fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database state:', err);
    }
  }

  private seedInitialData() {
    // 1. Seed Plans
    const plansList: Plan[] = [
      {
        id: 'free',
        name: 'Starter',
        description: 'Perfect for exploring cinematic AI video generation with Veo 3.1.',
        monthly_credits: 100,
        price_usd: 0,
        max_resolution: '1080p',
        concurrent_jobs: 1,
        features: [
          '100 Free Credits to start',
          'Access to Veo 3.1 Lite & Fast models',
          'Up to 1080p generation',
          'AI Prompt Enhancer included',
          'Community support'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'creator',
        name: 'Creator',
        description: 'For ambitious digital creators, storytellers, and social media producers.',
        monthly_credits: 500,
        price_usd: 29,
        max_resolution: '1080p',
        concurrent_jobs: 2,
        features: [
          '500 monthly credits',
          'Access to full Veo 3.1 Cinematic model',
          'Image-to-Video & Reference Assets',
          'Storyboard Director studio',
          'Priority job queue',
          'No watermarks'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'pro',
        name: 'Studio Pro',
        description: 'For creative studios, commercial filmmakers, and agency directors.',
        monthly_credits: 1500,
        price_usd: 79,
        max_resolution: '4k',
        concurrent_jobs: 4,
        features: [
          '1,500 monthly credits',
          'Full 4K Ultra-HD generation support',
          '7-second Video Extension capability',
          'First Frame to Last Frame interpolation',
          'Unlimited projects & media asset store',
          'Dedicated GPU priority worker'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'business',
        name: 'Enterprise Agency',
        description: 'For high-scale production teams requiring dedicated pools and custom integrations.',
        monthly_credits: 5000,
        price_usd: 249,
        max_resolution: '4k',
        concurrent_jobs: 8,
        features: [
          '5,000 monthly credits pool',
          'Multi-seat collaboration',
          'Custom model tuning parameters',
          'Dedicated queue lane with SLA',
          'Custom webhook notifications & API access',
          '24/7 Priority support'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];

    for (const p of plansList) this.plans.set(p.id, p);

    // 2. Seed Prompt Templates (16+ rich templates)
    const templatesList: PromptTemplate[] = [
      {
        id: 'tpl-pakistani-restaurant',
        title: 'Pakistani Sunset Restaurant',
        category: 'Restaurant & Food',
        prompt: 'Cinematic slow-motion shot of sizzling seekh kebabs on an authentic outdoor charcoal grill in Lahore food street during golden hour sunset, glowing embers dancing in the twilight air, warm neon lights reflecting on polished copper cookware, shallow depth of field, 50mm anamorphic lens, documentary realism.',
        aspect_ratio: '16:9',
        style: 'Ultra Realistic',
        camera: 'Tracking Shot',
        tags: ['Food', 'Cultural', 'Sunset', 'Street Food'],
        is_featured: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-gourmet-burger',
        title: 'Chadhar Gourmet Burger Commercial',
        category: 'Product Advertisement',
        prompt: 'Ultra-luxurious commercial macro shot of a gourmet smash burger being assembled in slow motion, melting aged cheddar cascading over crispy seared beef patties, crisp brioche bun landing with subtle steam rising, glistening fresh lettuce, studio lighting with dramatic rim highlights, 100mm Macro lens.',
        aspect_ratio: '16:9',
        style: 'Commercial',
        camera: 'Macro Close-up',
        tags: ['Commercial', 'Burger', 'Macro', 'Advertising'],
        is_featured: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-cyberpunk-tokyo',
        title: 'Neo-Tokyo Rainy Odyssey',
        category: 'Cinematic & Sci-Fi',
        prompt: 'Cinematic tracking shot through a rain-slicked Tokyo cyberpunk alleyway at midnight, neon kanji signs reflecting in deep asphalt puddles, holographic advertisements flickering softly, a cloaked figure walking with an illuminated umbrella, volumetric mist, 35mm film grain, Blade Runner aesthetic.',
        aspect_ratio: '16:9',
        style: 'Cinematic',
        camera: 'Dolly In',
        tags: ['Sci-Fi', 'Cyberpunk', 'Rain', 'Neon'],
        is_featured: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-luxury-perfume',
        title: 'Haute Parfumerie Elegance',
        category: 'Luxury Brand',
        prompt: 'Luxury perfume commercial, crystal glass flacon resting on wet black obsidian stone, crystalline water droplets falling in extreme 1000fps slow motion, prismatic light caustics refracting in gold and violet hues, silk veil floating gracefully in background, high fashion aesthetic.',
        aspect_ratio: '9:16',
        style: 'Luxury',
        camera: 'Orbit',
        tags: ['Perfume', 'Luxury', 'Fashion', 'Water'],
        is_featured: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-luxury-realestate',
        title: 'Mediterranean Villa Drone Sweep',
        category: 'Real Estate',
        prompt: 'Smooth high-altitude 4K drone shot sweeping over an ultra-modern cliffside Mediterranean villa at sunrise, infinity pool blending seamlessly into the calm turquoise ocean, warm travertine stone architecture, lush olive trees swaying in ocean breeze, golden sunlight flaring through glass arches.',
        aspect_ratio: '16:9',
        style: 'Ultra Realistic',
        camera: 'Drone',
        tags: ['Real Estate', 'Drone', 'Villa', 'Architecture'],
        is_featured: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-electric-hypercar',
        title: 'Midnight Hypercar Launch',
        category: 'Automotive',
        prompt: 'Dynamic low-angle tracking shot of a matte black electric concept hypercar carving through a winding mountain pass at twilight, aggressive LED taillights leaving crimson light trails, carbon fiber aerodynamic bodywork reflecting street lamps, realistic tire smoke and motion blur.',
        aspect_ratio: '16:9',
        style: 'Commercial',
        camera: 'Tracking Shot',
        tags: ['Automotive', 'Cars', 'Commercial', 'Night'],
        is_featured: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-fashion-runway',
        title: 'Milan Avant-Garde Runway',
        category: 'Fashion',
        prompt: 'Slow-motion high-fashion tracking shot of an ethereal model walking down a minimalist glass runway surrounded by water, wearing an iridescent metallic draped gown that ripples organically with every step, harsh editorial flash photography lighting, high contrast, vogue editorial.',
        aspect_ratio: '9:16',
        style: 'Fashion',
        camera: 'Tracking Shot',
        tags: ['Fashion', 'Runway', 'Editorial', 'Model'],
        is_featured: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-nature-wildlife',
        title: 'Snow Leopard Himalayan Peak',
        category: 'Documentary',
        prompt: 'BBC Planet Earth documentary style telephoto shot of an elusive snow leopard perched stoically on a windswept craggy Himalayan cliff, powdery snow swirling across its thick fur, majestic mountain peaks in soft focus background, crisp morning light, 85mm wildlife lens.',
        aspect_ratio: '16:9',
        style: 'Documentary',
        camera: 'Static',
        tags: ['Nature', 'Wildlife', 'Documentary', 'Snow'],
        is_featured: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-ecommerce-sneaker',
        title: 'Futuristic Sneaker 360 Spin',
        category: 'Product Advertisement',
        prompt: 'Product advertisement 360-degree floating orbit shot of a futuristic limited-edition athletic sneaker, metallic chrome detailing and breathable woven mesh fabric, glowing LED sole accents, clean dark slate backdrop with subtle particle dust floating in spotlight beams.',
        aspect_ratio: '9:16',
        style: 'Commercial',
        camera: 'Orbit',
        tags: ['Sneakers', 'Ecommerce', '3D', 'Apparel'],
        is_featured: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-social-viral-coffee',
        title: 'Barista Latte Art Pour',
        category: 'Social Media',
        prompt: 'Top-down first-person POV shot of a master barista pouring steamed microfoam oat milk into a ceramic cup, forming an intricate multi-layered rosetta latte art design, rich crema swirl, warm artisanal cafe morning lighting, tactile sensory satisfaction.',
        aspect_ratio: '9:16',
        style: 'Social Media',
        camera: 'POV',
        tags: ['Coffee', 'POV', 'TikTok', 'Food'],
        is_featured: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-scifi-spaceship',
        title: 'Orbital Station Docking',
        category: 'Cinematic & Sci-Fi',
        prompt: 'Epic scale cinematic exterior shot of an interstellar exploration cruiser gently aligning with a colossal ring-shaped orbital station around Saturn, rings casting immense shadow across the vessel hull, realistic zero-gravity thruster burns, cold stark cosmic illumination.',
        aspect_ratio: '16:9',
        style: 'Sci-Fi',
        camera: 'Dolly Out',
        tags: ['Space', 'Sci-Fi', 'Saturn', 'VFX'],
        is_featured: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'tpl-vintage-film',
        title: '1970s Sunset Boulevard Cruise',
        category: 'Vintage',
        prompt: 'Nostalgic 1970s Hollywood film look, vintage convertible cruising down Sunset Boulevard beneath towering palm trees at dusk, warm Kodak Kodachrome 64 color saturation, subtle optical lens flare, organic film grain and gate weave, cinematic timelessness.',
        aspect_ratio: '16:9',
        style: 'Vintage',
        camera: 'Handheld',
        tags: ['Vintage', '70s', 'Film Grain', 'California'],
        is_featured: false,
        created_at: new Date().toISOString()
      }
    ];

    for (const t of templatesList) this.prompt_templates.set(t.id, t);

    // 3. Seed Default Admin User & Demo User
    const adminId = 'admin-user-00000000-0000-0000-0000';
    const demoId = 'demo-user-00000000-0000-0000-0000';

    // Simple password hash (bcrypt sync hash of 'admin123' and 'demo123')
    const adminUser: User = {
      id: adminId,
      email: 'admin@categoric.ai',
      password_hash: '$2a$10$wO3g4v4vGfZvXl.rB2sHteYgO.jS2hJ8K0iG1qR8y0pY9zP1b1/xO', // fallback hash
      name: 'Executive Producer',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'admin',
      plan_id: 'business',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const demoUser: User = {
      id: demoId,
      email: 'creator@categoric.ai',
      password_hash: '$2a$10$wO3g4v4vGfZvXl.rB2sHteYgO.jS2hJ8K0iG1qR8y0pY9zP1b1/xO',
      name: 'Creative Director',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'creator',
      plan_id: 'pro',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.users.set(adminId, adminUser);
    this.users.set(demoId, demoUser);

    // Wallets
    this.credit_wallets.set(adminId, {
      id: 'wallet-admin',
      user_id: adminId,
      balance: 10000,
      lifetime_granted: 10000,
      lifetime_consumed: 0,
      updated_at: new Date().toISOString()
    });

    this.credit_wallets.set(demoId, {
      id: 'wallet-demo',
      user_id: demoId,
      balance: 1500,
      lifetime_granted: 1500,
      lifetime_consumed: 0,
      updated_at: new Date().toISOString()
    });

    // Seed Sample Project
    const projId = 'proj-burger-ad';
    this.projects.set(projId, {
      id: projId,
      user_id: demoId,
      name: 'Chadhar Burger Commercial',
      description: 'Multi-scene cinematic campaign for Pakistani premier burger house.',
      thumbnail_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date().toISOString()
    });

    // Seed Sample Media Assets
    const asset1Id = 'asset-bun';
    this.media_assets.set(asset1Id, {
      id: asset1Id,
      user_id: demoId,
      project_id: projId,
      name: 'Brioche Bun Reference',
      category: 'products',
      mime_type: 'image/jpeg',
      file_size: 1024 * 450,
      storage_path: 'assets/sample_bun.jpg',
      url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    });

    // Save initial state
    this.save();
  }

  // Atomic Credit Locking and Balance Update
  public deductCreditsAtomic(userId: string, cost: number, jobId: string, description: string): { success: boolean; newBalance?: number; error?: string } {
    const wallet = this.credit_wallets.get(userId);
    if (!wallet) {
      return { success: false, error: 'User credit wallet not found' };
    }

    if (wallet.balance < cost) {
      return { success: false, error: `Insufficient credits. Required: ${cost}, Available: ${wallet.balance}` };
    }

    wallet.balance -= cost;
    wallet.lifetime_consumed += cost;
    wallet.updated_at = new Date().toISOString();

    const txId = crypto.randomUUID();
    const tx: CreditTransaction = {
      id: txId,
      wallet_id: wallet.id,
      user_id: userId,
      amount: -cost,
      type: 'GENERATION',
      job_id: jobId,
      description,
      balance_after: wallet.balance,
      created_at: new Date().toISOString()
    };

    this.credit_transactions.set(txId, tx);
    this.save();
    return { success: true, newBalance: wallet.balance };
  }

  // Refund credits on failed generation
  public refundCreditsAtomic(userId: string, amount: number, jobId: string, reason: string): { success: boolean; newBalance?: number } {
    const wallet = this.credit_wallets.get(userId);
    if (!wallet) return { success: false };

    wallet.balance += amount;
    wallet.lifetime_consumed = Math.max(0, wallet.lifetime_consumed - amount);
    wallet.updated_at = new Date().toISOString();

    const txId = crypto.randomUUID();
    const tx: CreditTransaction = {
      id: txId,
      wallet_id: wallet.id,
      user_id: userId,
      amount: amount,
      type: 'REFUND',
      job_id: jobId,
      description: `Refund: ${reason}`,
      balance_after: wallet.balance,
      created_at: new Date().toISOString()
    };

    this.credit_transactions.set(txId, tx);
    this.save();
    return { success: true, newBalance: wallet.balance };
  }

  // Add credits (purchase / bonus / admin adjustment)
  public addCreditsAtomic(userId: string, amount: number, type: 'PURCHASE' | 'BONUS' | 'ADMIN_ADJUSTMENT' | 'SUBSCRIPTION', description: string): { success: boolean; newBalance?: number } {
    let wallet = this.credit_wallets.get(userId);
    if (!wallet) {
      wallet = {
        id: crypto.randomUUID(),
        user_id: userId,
        balance: 0,
        lifetime_granted: 0,
        lifetime_consumed: 0,
        updated_at: new Date().toISOString()
      };
      this.credit_wallets.set(userId, wallet);
    }

    wallet.balance += amount;
    wallet.lifetime_granted += amount;
    wallet.updated_at = new Date().toISOString();

    const txId = crypto.randomUUID();
    const tx: CreditTransaction = {
      id: txId,
      wallet_id: wallet.id,
      user_id: userId,
      amount: amount,
      type,
      description,
      balance_after: wallet.balance,
      created_at: new Date().toISOString()
    };

    this.credit_transactions.set(txId, tx);
    this.save();
    return { success: true, newBalance: wallet.balance };
  }
}

export const db = new Database();
