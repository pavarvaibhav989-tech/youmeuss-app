import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { queryOne, runSql } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * Generate access and refresh tokens for a user.
 */
function generateTokens(user) {
  const payload = { id: user.id, username: user.username, email: user.email };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 12);

    await runSql('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)', [
      id, username, email, password_hash,
    ]);

    const user = { id, username, email };
    const tokens = generateTokens(user);

    res.status(201).json({ user, ...tokens });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url };
    const tokens = generateTokens(safeUser);

    res.json({ user: safeUser, ...tokens });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, username, email, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(401).json({ error: 'User not found — session expired' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const dbUser = await queryOne('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
    if (!dbUser) {
      return res.status(401).json({ error: 'User no longer exists — please register again' });
    }

    const tokens = generateTokens(dbUser);
    res.json(tokens);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ─── Password Reset ───────────────────────────────────────────────────────────

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * POST /api/auth/forgot-password
 * Accepts { email }. Sends a password reset link if the account exists.
 * Always responds with 200 to avoid user enumeration.
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await queryOne('SELECT id, email, username FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    // Always respond 200 — don't reveal whether email exists
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await runSql(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
      [token, expires.toISOString(), user.id]
    );

    const CLIENT_URL = process.env.CLIENT_URL || 'https://youmeuss.vercel.app';
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;

    if (resend) {
      await resend.emails.send({
        from: 'YouMeUss <onboarding@resend.dev>',
        to: user.email,
        subject: 'Reset your YouMeUss password',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #f1f5f9; padding: 40px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 40px;">🎬</span>
              <h1 style="font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #e879f9, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 8px 0;">YouMeUss</h1>
            </div>
            <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">Reset your password</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">Hi ${user.username}, we received a request to reset your password. Click the button below — this link expires in 1 hour.</p>
            <a href="${resetLink}" style="display: block; text-align: center; padding: 14px 24px; background: linear-gradient(135deg, #e879f9, #8b5cf6); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">Reset Password</a>
            <p style="color: #475569; font-size: 12px; margin-top: 24px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } else {
      // Dev fallback — log to console if Resend not configured
      console.log(`\n🔑 [DEV] Password reset link for ${user.email}:\n${resetLink}\n`);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Accepts { token, password }. Validates token and updates the password.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await queryOne(
      'SELECT id FROM users WHERE reset_token = ? AND reset_expires > ?',
      [token, new Date().toISOString()]
    );

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });

    const password_hash = await bcrypt.hash(password, 12);

    await runSql(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [password_hash, user.id]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
