// Vercel serverless entry point. The whole Express app (API routes + error handler)
// runs as one function; static files under public/ are served directly by Vercel's
// CDN per vercel.json, so this function only ever sees /api/* and /admin/api/* traffic.
import app from '../server/app.js';

export default app;
