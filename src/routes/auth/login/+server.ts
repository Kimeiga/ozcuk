/**
 * Login route - redirects to Google OAuth
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleAuthUrl } from '$lib/server/auth';
import { nanoid } from 'nanoid';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  const clientId = platform?.env?.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    // In development without Google OAuth, show a message
    return new Response('Google OAuth not configured. Set GOOGLE_CLIENT_ID environment variable.', {
      status: 503
    });
  }

  // Generate state for CSRF protection
  const state = nanoid(16);
  cookies.set('oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  });

  // Build redirect URI
  const redirectUri = `${url.origin}/auth/callback`;
  
  // Redirect to Google
  const authUrl = getGoogleAuthUrl(clientId, redirectUri, state);
  redirect(302, authUrl);
};

