
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AppContext } from './types';
import { authMiddleware } from './auth';

const podcastRoutes = new Hono<AppContext['env']>();

// Zod schema for validating the podcast episode creation payload
const createPodcastSchema = z.object({
  title: z.string().min(1, 'Episode title cannot be empty.'),
  description: z.string().optional(),
  audio_url: z.string().url('A valid audio URL is required.'),
  cover_url: z.string().url('Invalid cover URL.').optional(),
});

/**
 * POST /podcasts
 * Creates a new podcast episode entry. Protected route.
 */
podcastRoutes.post('/', authMiddleware, zValidator('json', createPodcastSchema), async (c) => {
    const { title, description, audio_url, cover_url } = c.req.valid('json');
    const creatorId = c.get('userId');

    try {
        const { meta } = await c.env.DB.prepare(
            'INSERT INTO podcasts (creator_id, title, description, audio_url, cover_url) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(creatorId, title, description, audio_url, cover_url)
        .run();

        if (!meta.last_row_id) {
            return c.json({ error: 'Failed to create podcast episode.' }, 500);
        }

        const newEpisode = await c.env.DB.prepare('SELECT * FROM podcasts WHERE id = ?').bind(meta.last_row_id).first();
        return c.json({ message: 'Podcast episode created successfully.', episode: newEpisode }, 201);
    } catch (e: any) {
        console.error("Create Podcast DB Error:", e.message);
        return c.json({ error: 'An error occurred while creating the podcast episode.' }, 500);
    }
});

/**
 * GET /podcasts
 * Fetches all podcast episodes. Public route.
 */
podcastRoutes.get('/', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            `SELECT p.*, u.username as creator_name 
             FROM podcasts p
             JOIN users u ON p.creator_id = u.id
             ORDER BY p.created_at DESC`
        ).all();
        return c.json(results);
    } catch (e: any) {
        console.error("Fetch Podcasts DB Error:", e.message);
        return c.json({ error: 'Failed to fetch podcast episodes.' }, 500);
    }
});

export default podcastRoutes;
