
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { AppContext } from './types';

// Import route handlers
import userRoutes from './users';
import postRoutes from './posts';
import brandRoutes from './brands';
import eventRoutes from './events';
import podcastRoutes from './podcasts';
import storyRoutes from './stories';
import productRoutes from './products';
import reelRoutes from './reels';
import groupRoutes from './groups';
import songRoutes from './songs';
import messageRoutes from './messages';


// Initialize the Hono app with our custom typed context
const app = new Hono<AppContext['env']>().basePath('/api');

// --- Global Middleware ---
app.use('*', logger()); // Log all requests to the console
app.use('*', cors());   // Enable Cross-Origin Resource Sharing for all routes

// --- API Routing ---
app.route('/users', userRoutes);
app.route('/posts', postRoutes);
app.route('/brands', brandRoutes);
app.route('/events', eventRoutes);
app.route('/podcasts', podcastRoutes);
app.route('/stories', storyRoutes);
app.route('/products', productRoutes);
app.route('/reels', reelRoutes);
app.route('/groups', groupRoutes);
app.route('/songs', songRoutes);
app.route('/messages', messageRoutes);
app.route('/conversations', messageRoutes); // Conversations are part of messages


// A simple root endpoint to confirm the API is running and discoverable
app.get('/', (c) => {
    return c.json({
        message: 'Welcome to the UNERA API!',
        docs: 'See the API specification for available endpoints.',
        endpoints: [
            'GET /posts',
            'POST /posts',
            'POST /posts/:id/like',
            'POST /posts/:id/comment',
            'GET /posts/:id/comments',
            'POST /users/signup',
            'POST /users/login',
            'GET /users/me',
            'POST /users/:id/follow',
            'GET /brands',
            'POST /brands',
            'GET /events',
            'POST /events',
            'GET /podcasts',
            'POST /podcasts',
            'GET /stories',
            'POST /stories',
            'GET /products',
            'POST /products',
            'GET /reels',
            'POST /reels',
            'POST /reels/:id/like',
            'POST /reels/:id/comment',
            'GET /groups',
            'POST /groups',
            'POST /groups/:id/join',
            'GET /groups/:id/posts',
            'POST /groups/:id/posts',
            'GET /songs',
            'POST /songs',
            'POST /songs/:id/like',
            'GET /conversations',
            'POST /messages',
        ]
    });
});

// --- Cloudflare Pages Functions Export ---
// The `onRequest` handler is the entry point for all requests to this function.
// Hono's `app.fetch` method is compatible with the Cloudflare Worker runtime.
export const onRequest = app.fetch;
