import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, runSql } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * Generate a short, human-readable room code.
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/rooms
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const id = uuidv4();
    let room_code = generateRoomCode();

    // Ensure unique room code
    while (await queryOne('SELECT id FROM rooms WHERE room_code = ?', [room_code])) {
      room_code = generateRoomCode();
    }

    await runSql('INSERT INTO rooms (id, room_code, host_user_id, status) VALUES (?, ?, ?, ?)', [
      id, room_code, req.user.id, 'active',
    ]);

    await runSql('INSERT INTO participants (id, room_id, user_id) VALUES (?, ?, ?)', [
      uuidv4(), id, req.user.id,
    ]);

    const room = await queryOne('SELECT * FROM rooms WHERE id = ?', [id]);

    res.status(201).json({ room });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/rooms/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const room = await queryOne('SELECT * FROM rooms WHERE id = ? OR room_code = ?', [id, id]);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const participants = await queryAll(`
      SELECT u.id, u.username, u.avatar_url, p.joined_at
      FROM participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = ?
    `, [room.id]);

    const host = await queryOne('SELECT id, username, avatar_url FROM users WHERE id = ?', [room.host_user_id]);

    res.json({ room, participants, host });
  } catch (err) {
    console.error('Get room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/rooms/:id/join
 */
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const room = await queryOne('SELECT * FROM rooms WHERE id = ? OR room_code = ?', [id, id]);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'active') {
      return res.status(400).json({ error: 'Room is no longer active' });
    }

    const existing = await queryOne('SELECT id FROM participants WHERE room_id = ? AND user_id = ?', [
      room.id, req.user.id,
    ]);

    if (!existing) {
      await runSql('INSERT INTO participants (id, room_id, user_id) VALUES (?, ?, ?)', [
        uuidv4(), room.id, req.user.id,
      ]);
    }

    const participants = await queryAll(`
      SELECT u.id, u.username, u.avatar_url, p.joined_at
      FROM participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = ?
    `, [room.id]);

    res.json({ room, participants });
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/rooms/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const room = await queryOne('SELECT * FROM rooms WHERE id = ?', [id]);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.host_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the host can delete this room' });
    }

    await runSql('DELETE FROM rooms WHERE id = ?', [id]);

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
