import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
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

    const existing = queryOne('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 12);

    runSql('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)', [
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

    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);

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
router.get('/me', authenticate, (req, res) => {
  try {
    const user = queryOne('SELECT id, username, email, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);

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
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Verify user still exists in DB (handles server restart wiping in-memory DB)
    const dbUser = queryOne('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
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

export default router;
