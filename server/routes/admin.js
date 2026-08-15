import { Router } from 'express';
import { query, migrate } from '../db/db.js';
import { buildWorkbook } from '../export/buildWorkbook.js';

const router = Router();

function basicAuth(req, res, next) {
  const expected = process.env.ADMIN_PASSWORD || 'change-me';
  const header = req.headers.authorization || '';
  const [, encoded] = header.split(' ');
  if (!encoded) {
    res.set('WWW-Authenticate', 'Basic realm="Study Admin"');
    return res.status(401).send('Authentication required');
  }
  const [, password] = Buffer.from(encoded, 'base64').toString().split(':');
  if (password !== expected) {
    res.set('WWW-Authenticate', 'Basic realm="Study Admin"');
    return res.status(401).send('Invalid password');
  }
  next();
}

router.use(basicAuth);

// TEMPORARY diagnostic — reveals only hostname/port/query-params, never credentials.
router.get('/debug-db', (req, res) => {
  const raw = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
  try {
    const u = new URL(raw);
    res.json({
      hasEnv: !!raw,
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      searchParams: Object.fromEntries(u.searchParams),
    });
  } catch (e) {
    res.json({ hasEnv: !!raw, parseError: e.message });
  }
});

// One-time (idempotent) schema setup — call this once after DATABASE_URL is configured,
// and again safely any time after (CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS).
router.post('/migrate', async (req, res, next) => {
  try {
    await migrate();
    res.json({ ok: true, message: 'Schema is up to date.' });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const total = (await query('SELECT COUNT(*) AS n FROM respondents')).rows[0].n;
    const completed = (await query("SELECT COUNT(*) AS n FROM respondents WHERE status = 'completed'")).rows[0].n;
    const inProgress = (await query("SELECT COUNT(*) AS n FROM respondents WHERE status = 'in_progress'")).rows[0].n;
    const screenedOut = (await query("SELECT COUNT(*) AS n FROM respondents WHERE status = 'screened_out'")).rows[0].n;
    const avgDuration = (await query("SELECT AVG(duration_seconds) AS avg FROM respondents WHERE status='completed'")).rows[0].avg;
    const byDevice = (await query('SELECT device_type, COUNT(*) AS n FROM respondents GROUP BY device_type')).rows;
    const lastSubmission = (await query('SELECT MAX(completed_at) AS t FROM respondents')).rows[0].t;
    res.json({
      total: Number(total), completed: Number(completed), inProgress: Number(inProgress), screenedOut: Number(screenedOut),
      avgDurationSeconds: avgDuration ? Number(avgDuration) : null,
      byDevice: byDevice.map((r) => ({ device_type: r.device_type, n: Number(r.n) })),
      lastSubmission,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/export.xlsx', async (req, res, next) => {
  try {
    const wb = await buildWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="blinkit_impulse_study_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;
