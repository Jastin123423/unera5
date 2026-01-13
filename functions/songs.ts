
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AppContext } from './types';
import { authMiddleware } from './auth';

const songRoutes = new Hono<AppContext['env']>();

const createSongSchema = z.object({
  title: z.string().min(1),
  artist_name: z.string().min(1),
  audio_url: z.string().url(),
  cover_image_url: z.string().url(),
  album_name: z.string().optional(),
  genre: z.string().optional(),
});

const commentSchema = z.object({
  text: z.string().min(1),
});

// GET /songs - Fetch all songs
songRoutes.get('/', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            `SELECT s.*, u.username as uploader_name
             FROM songs s
             JOIN users u ON s.uploader_id = u.id
             ORDER BY s.created_at DESC`
        ).all();
        return c.json(results);
    } catch (e: any) {
        return c.json({ error: 'Failed to fetch songs' }, 500);
    }
});

// POST /songs - Upload a new song
songRoutes.post('/', authMiddleware, zValidator('json', createSongSchema), async (c) => {
    const uploaderId = c.get('userId');
    const songData = c.req.valid('json');
    try {
        const { meta } = await c.env.DB.prepare(
            'INSERT INTO songs (uploader_id, title, artist_name, album_name, cover_image_url, audio_url, genre) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(uploaderId, songData.title, songData.artist_name, songData.album_name, songData.cover_image_url, songData.audio_url, songData.genre).run();

        const newSong = await c.env.DB.prepare('SELECT * FROM songs WHERE id = ?').bind(meta.last_row_id).first();
        return c.json(newSong, 201);
    } catch (e: any) {
        return c.json({ error: 'Failed to upload song' }, 500);
    }
});

// POST /songs/:id/like - Like or unlike a song
songRoutes.post('/:id/like', authMiddleware, async (c) => {
    const userId = c.get('userId');
    const songId = parseInt(c.req.param('id'), 10);
    if (isNaN(songId)) return c.json({ error: 'Invalid song ID' }, 400);

    const existingLike: { id: number } | null = await c.env.DB.prepare('SELECT id FROM song_likes WHERE user_id = ? AND song_id = ?').bind(userId, songId).first();
    if (existingLike) {
        await c.env.DB.prepare('DELETE FROM song_likes WHERE id = ?').bind(existingLike.id).run();
        return c.json({ message: 'Unliked' });
    } else {
        await c.env.DB.prepare('INSERT INTO song_likes (user_id, song_id) VALUES (?, ?)').bind(userId, songId).run();
        return c.json({ message: 'Liked' });
    }
});

// GET /songs/:id/comments - Get comments for a song
songRoutes.get('/:id/comments', async (c) => {
    const songId = parseInt(c.req.param('id'), 10);
    if (isNaN(songId)) return c.json({ error: 'Invalid song ID' }, 400);

    const { results } = await c.env.DB.prepare(
        `SELECT sc.*, u.username as author_name, u.profile_image_url as author_image
         FROM song_comments sc
         JOIN users u ON sc.user_id = u.id
         WHERE sc.song_id = ? ORDER BY sc.created_at ASC`
    ).bind(songId).all();
    return c.json(results);
});

// POST /songs/:id/comment - Add a comment to a song
songRoutes.post('/:id/comment', authMiddleware, zValidator('json', commentSchema), async (c) => {
    const userId = c.get('userId');
    const songId = parseInt(c.req.param('id'), 10);
    const { text } = c.req.valid('json');
    if (isNaN(songId)) return c.json({ error: 'Invalid song ID' }, 400);

    const { meta } = await c.env.DB.prepare('INSERT INTO song_comments (user_id, song_id, text) VALUES (?, ?, ?)').bind(userId, songId, text).run();
    const newComment = await c.env.DB.prepare('SELECT * FROM song_comments WHERE id = ?').bind(meta.last_row_id).first();
    return c.json(newComment, 201);
});

export default songRoutes;
