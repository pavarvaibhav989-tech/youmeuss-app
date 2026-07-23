import { Router } from 'express';
import { queryAll } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/rooms/:id/messages
 */
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;

    let messages;

    if (before) {
      messages = await queryAll(`
        SELECT m.id, m.message, m.created_at, m.user_id,
               u.username, u.avatar_url
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ? AND m.created_at < ?
        ORDER BY m.created_at DESC
        LIMIT ?
      `, [id, before, parseInt(limit)]);
    } else {
      messages = await queryAll(`
        SELECT m.id, m.message, m.created_at, m.user_id,
               u.username, u.avatar_url
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ?
        ORDER BY m.created_at DESC
        LIMIT ?
      `, [id, parseInt(limit)]);
    }

    res.json({ messages: messages.reverse() });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
