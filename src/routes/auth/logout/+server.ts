/**
 * Logout route - clears session
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSession, getSessionCookieName } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, platform, locals }) => {
  const sessionId = cookies.get(getSessionCookieName());
  const db = platform?.env?.DB;

  // Delete session from database if possible
  if (sessionId && db) {
    try {
      await deleteSession(db, sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  // Clear session cookie
  cookies.delete(getSessionCookieName(), { path: '/' });

  // Redirect to home
  redirect(302, '/');
};

