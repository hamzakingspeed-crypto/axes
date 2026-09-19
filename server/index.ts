import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDb } from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'Axes backend' });
});

app.get('/api/config', (_req, res) => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  res.json({
    hasOpenAIKey: hasKey,
    hasExaKey: Boolean(process.env.EXA_API_KEY),
    mode: 'display',
  });
});

app.post('/api/openai/realtime/session', async (_req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(401).json({ error: 'OPENAI_API_KEY is not configured.' });
  }

  try {
    const client = new OpenAI({ apiKey });
    const session = await client.beta.realtime.sessions.create({
      model: 'gpt-realtime-2',
      voice: 'verse',
      modalities: ['text', 'audio'],
      instructions: `You are Axes, a calm and useful AI companion. Speak concise, operator-like updates, ask clarifying questions when needed, and keep interactions focused on useful work. Use tools when asked and explain what you are doing without over-explaining.`,
      tool_choice: 'auto',
    });

    return res.json({ session });
  } catch (error) {
    console.error('Failed to create Realtime session', error);
    return res.status(500).json({
      error: 'Unable to create OpenAI Realtime session.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/notes', (_req, res) => {
  const db = initializeDb();
  const rows = db.prepare('SELECT * FROM notes ORDER BY created_at DESC').all();
  return res.json(rows);
});

app.post('/api/notes', (req, res) => {
  const { title, content } = req.body ?? {};

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required.' });
  }

  const db = initializeDb();
  const result = db
    .prepare(
      'INSERT INTO notes (title, content, created_at) VALUES (?, ?, datetime("now"))'
    )
    .run(title, content);

  return res.json({ id: Number(result.lastInsertRowid), title, content });
});

app.get('/api/tasks', (_req, res) => {
  const db = initializeDb();
  const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  return res.json(rows);
});

app.post('/api/tasks', (req, res) => {
  const { title, status, detail } = req.body ?? {};
  const db = initializeDb();
  const result = db
    .prepare(
      'INSERT INTO tasks (title, status, detail, created_at) VALUES (?, ?, ?, datetime("now"))'
    )
    .run(title ?? 'New task', status ?? 'queued', detail ?? '');

  return res.json({ id: Number(result.lastInsertRowid), title, status, detail });
});

app.post('/api/tasks/:id/update', (req, res) => {
  const { status, detail } = req.body ?? {};
  const db = initializeDb();
  const result = db
    .prepare('UPDATE tasks SET status = ?, detail = ? WHERE id = ?')
    .run(status ?? 'queued', detail ?? '', Number(req.params.id));

  return res.json({ updated: result.changes > 0 });
});

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(rootDir, 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

initializeDb();

app.listen(port, () => {
  console.log(`Axes backend listening on http://localhost:${port}`);
});
