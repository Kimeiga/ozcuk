/**
 * Notes API - CRUD operations for word notes
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { nanoid } from 'nanoid';

// GET /api/notes?word=kelime - Get note for a specific word
export const GET: RequestHandler = async ({ url, locals, platform }) => {
  if (!locals.user) {
    error(401, 'Not authenticated');
  }

  const word = url.searchParams.get('word');
  if (!word) {
    error(400, 'Missing word parameter');
  }

  const db = platform?.env?.DB;
  if (!db) {
    error(503, 'Database not available');
  }

  const note = await db.prepare(`
    SELECT id, word, note, created_at, updated_at
    FROM word_notes
    WHERE user_id = ? AND word = ?
  `).bind(locals.user.id, word).first<{
    id: string;
    word: string;
    note: string;
    created_at: string;
    updated_at: string;
  }>();

  return json({ note: note || null });
};

// POST /api/notes - Create or update a note
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.user) {
    error(401, 'Not authenticated');
  }

  const db = platform?.env?.DB;
  if (!db) {
    error(503, 'Database not available');
  }

  const body = await request.json() as { word: string; note: string };
  const { word, note } = body;

  if (!word || typeof note !== 'string') {
    error(400, 'Missing word or note');
  }

  const now = new Date().toISOString();
  const noteId = nanoid(16);

  await db.prepare(`
    INSERT INTO word_notes (id, user_id, word, note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, word) DO UPDATE SET
      note = excluded.note,
      updated_at = excluded.updated_at
  `).bind(noteId, locals.user.id, word, note, now, now).run();

  return json({ success: true });
};

// DELETE /api/notes?word=kelime - Delete a note
export const DELETE: RequestHandler = async ({ url, locals, platform }) => {
  if (!locals.user) {
    error(401, 'Not authenticated');
  }

  const word = url.searchParams.get('word');
  if (!word) {
    error(400, 'Missing word parameter');
  }

  const db = platform?.env?.DB;
  if (!db) {
    error(503, 'Database not available');
  }

  await db.prepare(`
    DELETE FROM word_notes
    WHERE user_id = ? AND word = ?
  `).bind(locals.user.id, word).run();

  return json({ success: true });
};

