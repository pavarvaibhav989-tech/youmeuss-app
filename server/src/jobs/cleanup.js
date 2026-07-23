/**
 * Room cleanup job.
 * Deletes rooms (and their cascaded participants/messages/videos)
 * that haven't had any activity in the last 7 days.
 *
 * Runs once on server startup, then every 24 hours.
 */
import { runSql, queryAll } from '../db/index.js';

const INACTIVE_DAYS = 7;          // delete rooms older than this
const INTERVAL_MS   = 24 * 60 * 60 * 1000; // run every 24 hours

/**
 * Perform the cleanup — deletes stale rooms.
 * Rooms with no messages at all use their creation date.
 * Rooms with messages use the date of the most recent message.
 */
export async function cleanupStaleRooms() {
  try {
    // Find rooms where the most recent activity (message or creation) is older than INACTIVE_DAYS
    const stale = await queryAll(`
      SELECT r.id, r.room_code, r.created_at,
             MAX(m.created_at) AS last_message_at
      FROM rooms r
      LEFT JOIN messages m ON m.room_id = r.id
      GROUP BY r.id
      HAVING COALESCE(MAX(m.created_at), r.created_at) < NOW() - INTERVAL '${INACTIVE_DAYS} days'
    `);

    if (stale.length === 0) {
      console.log(`🧹 Room cleanup: no stale rooms found`);
      return;
    }

    for (const room of stale) {
      // Participants and messages cascade-delete when the room is deleted
      await runSql('DELETE FROM rooms WHERE id = ?', [room.id]);
    }

    console.log(`🧹 Room cleanup: deleted ${stale.length} stale room(s) (inactive > ${INACTIVE_DAYS} days)`);
  } catch (err) {
    // Don't crash the server if cleanup fails
    console.error('⚠️  Room cleanup error:', err.message);
  }
}

/**
 * Start the recurring cleanup schedule.
 * Runs immediately on call, then repeats every 24 hours.
 */
export function startCleanupSchedule() {
  // Run immediately on startup
  cleanupStaleRooms();

  // Then repeat every 24 hours
  const interval = setInterval(cleanupStaleRooms, INTERVAL_MS);

  // Don't keep the Node process alive just for this timer
  if (interval.unref) interval.unref();

  console.log(`🧹 Room cleanup scheduled: runs every 24h, removes rooms inactive > ${INACTIVE_DAYS} days`);
}
