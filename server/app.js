import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes/api.js';
import adminRouter from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.json({ limit: '2mb' }));

app.use('/api', apiRouter);
app.use('/admin/api', adminRouter);

// Local/dev convenience — on Vercel these paths are served directly as static files
// (see vercel.json), so this middleware is a no-op there but keeps `npm start` working
// as a single self-contained server for local runs.
app.use(express.static(PUBLIC_DIR));
app.use('/admin', express.static(path.join(PUBLIC_DIR, 'admin')));

app.get('/health', (req, res) => res.json({ ok: true }));

// Central error handler so a failed query returns JSON instead of hanging/crashing
// the function (important on Vercel, where an uncaught throw kills the invocation).
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
