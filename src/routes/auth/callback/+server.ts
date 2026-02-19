/**
 * OAuth callback route - handles Google OAuth callback
 */

import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  exchangeCodeForTokens,
  getGoogleUserInfo,
  upsertUser,
  createSession,
  getSessionCookieName,
  getSessionCookieOptions
} from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('oauth_state');

  // Validate state
  if (!state || state !== storedState) {
    error(400, 'Invalid state parameter');
  }

  // Clear the state cookie
  cookies.delete('oauth_state', { path: '/' });

  if (!code) {
    error(400, 'Missing authorization code');
  }

  const clientId = platform?.env?.GOOGLE_CLIENT_ID;
  const clientSecret = platform?.env?.GOOGLE_CLIENT_SECRET;
  const db = platform?.env?.DB;

  if (!clientId || !clientSecret || !db) {
    error(503, 'OAuth not properly configured');
  }

  try {
    // Exchange code for tokens
    const redirectUri = `${url.origin}/auth/callback`;
    const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.accessToken);

    // Create or update user in database
    const user = await upsertUser(db, googleUser);

    // Create session
    const session = await createSession(db, user.id);

    // Set session cookie
    cookies.set(
      getSessionCookieName(),
      session.id,
      getSessionCookieOptions(session.expiresAt)
    );

    // Redirect to home
    redirect(302, '/');
  } catch (e) {
    console.error('OAuth callback error:', e);
    error(500, 'Authentication failed');
  }
};

