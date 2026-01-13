
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AppContext } from './types';
import { authMiddleware } from './auth';

const postRoutes = new Hono<AppContext['env']>();

const createPostSchema = z.object({
    content: z.string().min(1).optional(),
    media_url: z.string().url().optional(),
    type: z.string().optional(),
    visibility: z.string().optional(),
}).refine(data => data.content || data.media_url, {
    message: "A post must have content or media",
});

const commentSchema = z.object({ text: z.string().min(1) });

postRoutes.get('/', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            `SELECT p.*, u.username as author_name, u.profile_image_url as author_image
             FROM posts p 
             JOIN users u ON p.user_id = u.id 
             ORDER BY p.created_at DESC LIMIT 50`
        ).all();
        return c.json(results);
    } catch (e: any) {
        return c.json({ error: 'Failed to fetch posts.' }, 500);
    }
});

postRoutes.post('/', authMiddleware, zValidator('json', createPostSchema), async (c) => {
    const { content, media_url, type, visibility } = c.req.valid('json');
    const userId = c.get('userId');
    try {
        const { meta } = await c.env.DB.prepare('INSERT INTO posts (user_id, content, media_url, type, visibility) VALUES (?, ?, ?, ?, ?)')
            .bind(userId, content || null, media_url || null, type || 'text', visibility || 'Public')
            .run();
        const newPost = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(meta.last_row_id).first();
        return c.json(newPost, 201);
    } catch (e: any) {
        return c.json({ error: 'An error occurred.' }, 500);
    }
});

postRoutes.delete('/:id', authMiddleware, async (c) => {
    const postId = c.req.param('id');
    const userId = c.get('userId');
    const post: any = await c.env.DB.prepare('SELECT user_id FROM posts WHERE id = ?').bind(postId).first();
    if (!post) return c.json({ error: 'Post not found' }, 404);
    if (post.user_id !== userId) return c.json({ error: 'Forbidden' }, 403);

    await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();
    return c.json({ message: 'Post deleted' });
});

postRoutes.post('/:id/like', authMiddleware, async (c) => {
    const postId = parseInt(c.req.param('id'), 10);
    const userId = c.get('userId');
    const existingLike = await c.env.DB.prepare('SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?').bind(userId, postId).first();
    if (existingLike) {
        await c.env.DB.prepare('DELETE FROM post_likes WHERE id = ?').bind(existingLike.id).run();
        return c.json({ message: 'Unliked' });
    } else {
        await c.env.DB.prepare('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)').bind(userId, postId).run();
        return c.json({ message: 'Liked' });
    }
});

postRoutes.post('/:id/comment', authMiddleware, zValidator('json', commentSchema), async (c) => {
    const postId = parseInt(c.req.param('id'), 10);
    const userId = c.get('userId');
    const { text } = c.req.valid('json');
    const { meta } = await c.env.DB.prepare('INSERT INTO post_comments (user_id, post_id, text) VALUES (?, ?, ?)').bind(userId, postId, text).run();
    const newComment = await c.env.DB.prepare('SELECT * FROM post_comments WHERE id = ?').bind(meta.last_row_id).first();
    return c.json(newComment, 201);
});

export default postRoutes;
