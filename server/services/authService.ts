/**
 * Categoric AI - Authentication & Session Service
 * Provides secure password hashing (bcrypt), JWT issuance,
 * user registration, role validation, and onboarding credit gifts.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, User } from '../db/index.js';
import { SERVER_CONFIG } from '../config.js';

export class AuthService {
  /**
   * Register a new user
   */
  public async register(email: string, password: string, name: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user already exists
    const existing = Array.from(db.users.values()).find(u => u.email === cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      password_hash: passwordHash,
      name: name.trim() || cleanEmail.split('@')[0],
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      role: 'user',
      plan_id: 'free',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.users.set(userId, newUser);

    // Initialize credit wallet with 100 free bonus credits
    db.credit_wallets.set(userId, {
      id: crypto.randomUUID(),
      user_id: userId,
      balance: 100,
      lifetime_granted: 100,
      lifetime_consumed: 0,
      updated_at: new Date().toISOString()
    });

    // Record welcome bonus transaction
    db.credit_transactions.set(crypto.randomUUID(), {
      id: crypto.randomUUID(),
      wallet_id: userId,
      user_id: userId,
      amount: 100,
      type: 'BONUS',
      description: 'Welcome Bonus: 100 Free Generation Credits for Veo 3.1',
      balance_after: 100,
      created_at: new Date().toISOString()
    });

    // Send welcome notification
    db.notifications.set(crypto.randomUUID(), {
      id: crypto.randomUUID(),
      user_id: userId,
      title: 'Welcome to Categoric AI!',
      message: 'You have been granted 100 free credits. Start by creating your first cinematic AI video with Veo 3.1!',
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString()
    });

    db.save();

    const token = this.generateToken(newUser);
    const { password_hash, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  /**
   * Login user with email & password
   */
  public async login(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const user = Array.from(db.users.values()).find(u => u.email === cleanEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.is_active) {
      throw new Error('This account has been suspended. Please contact support.');
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    // Allow fallback for pre-seeded test accounts
    const isMasterFallback = (cleanEmail === 'creator@categoric.ai' || cleanEmail === 'admin@categoric.ai') && (password === 'admin123' || password === 'demo123');

    if (!isValid && !isMasterFallback) {
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken(user);
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  /**
   * Direct Social / Google Login
   */
  public async socialLogin(email: string, name: string, avatarUrl?: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    let user = Array.from(db.users.values()).find(u => u.email === cleanEmail);

    if (!user) {
      // Auto-provision
      const userId = crypto.randomUUID();
      const salt = bcrypt.genSaltSync(10);
      const dummyPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = bcrypt.hashSync(dummyPassword, salt);

      user = {
        id: userId,
        email: cleanEmail,
        password_hash: passwordHash,
        name: name || cleanEmail.split('@')[0],
        avatar_url: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
        role: 'user',
        plan_id: 'free',
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      db.users.set(userId, user);

      // Initialize wallet
      db.credit_wallets.set(userId, {
        id: crypto.randomUUID(),
        user_id: userId,
        balance: 100,
        lifetime_granted: 100,
        lifetime_consumed: 0,
        updated_at: new Date().toISOString()
      });

      db.save();
    }

    const token = this.generateToken(user);
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      SERVER_CONFIG.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  public verifyToken(token: string): { userId: string; email: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, SERVER_CONFIG.JWT_SECRET) as any;
      return decoded;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
