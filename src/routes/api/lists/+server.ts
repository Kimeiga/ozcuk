/**
 * Word Lists API - CRUD operations for word lists
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { nanoid } from 'nanoid';

// GET /api/lists - Get all lists for the user
export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) {
    error(401, 'Not authenticated');
  }

  const db = platform?.env?.DB;
  if (!db) {
    error(503, 'Database not available');
  }

  const lists = await db.prepare(`
    SELECT l.id, l.name, l.description, l.is_public, l.created_at, l.updated_at,
           COUNT(i.id) as word_count
    FROM word_lists l
    LEFT JOIN word_list_items i ON l.id = i.list_id
    WHERE l.user_id = ?
    GROUP BY l.id
    ORDER BY l.updated_at DESC
  `).bind(locals.user.id).all<{
    id: string;
    name: string;
    description: string | null;
    is_public: number;
    created_at: string;
    updated_at: string;
    word_count: number;
  }>();

  return json({ lists: lists.results || [] });
};

// POST /api/lists - Create a new list
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.user) {
    error(401, 'Not authenticated');
  }

  const db = platform?.env?.DB;
  if (!db) {
    error(503, 'Database not available');
  }

  const body = await request.json() as { name: string; description?: string; isPublic?: boolean };
  const { name, description, isPublic } = body;

  if (!name) {
    error(400, 'Missing list name');
  }

  const listId = nanoid(16);
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO word_lists (id, user_id, name, description, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(listId, locals.user.id, name, description || null, isPublic ? 1 : 0, now, now).run();

  return json({ id: listId, success: true });
};

// PUT /api/lists - Add a word to a list
export const PUT: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.user) {
    error(401, 'Not authenticated');
  }

  const db = platform?.env?.DB;
  if (!db) {
    error(503, 'Database not available');
  }

  const body = await request.json() as { listId: string; word: string };
  const { listId, word } = body;

  if (!listId || !word) {
    error(400, 'Missing listId or word');
  }

  // Verify list ownership
  const list = await db.prepare(`
    SELECT id FROM word_lists WHERE id = ? AND user_id = ?
  `).bind(listId, locals.user.id).first();

  if (!list) {
    error(404, 'List not found');
  }

  const itemId = nanoid(16);
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO word_list_items (id, list_id, word, added_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(list_id, word) DO NOTHING
  `).bind(itemId, listId, word, now).run();

  // Update list updated_at
  await db.prepare(`
    UPDATE word_lists SET updated_at = ? WHERE id = ?
  `).bind(now, listId).run();

  return json({ success: true });
};

// DELETE /api/lists - Delete a list or remove a word from a list
export const DELETE: RequestHandler = async ({ url, locals, platform }) => {
  if (!locals.user) {
    error(401, 'Not authenticated');
  }

  const db = platform?.env?.DB;
  if (!db) {
    error(503, 'Database not available');
  }

  const listId = url.searchParams.get('listId');
  const word = url.searchParams.get('word');

  if (!listId) {
    error(400, 'Missing listId');
  }

  // Verify ownership
  const list = await db.prepare(`
    SELECT id FROM word_lists WHERE id = ? AND user_id = ?
  `).bind(listId, locals.user.id).first();

  if (!list) {
    error(404, 'List not found');
  }

  if (word) {
    // Remove word from list
    await db.prepare(`DELETE FROM word_list_items WHERE list_id = ? AND word = ?`)
      .bind(listId, word).run();
  } else {
    // Delete entire list (items will cascade delete)
    await db.prepare(`DELETE FROM word_lists WHERE id = ?`).bind(listId).run();
  }

  return json({ success: true });
};

