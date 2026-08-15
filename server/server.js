// Local development entry point. On Vercel, api/index.js imports server/app.js
// directly as the serverless function handler instead of using this file.
import app from './app.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Blinkit impulse-buying study running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
});
