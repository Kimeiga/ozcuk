/**
 * Server hooks for authentication
 */

import type { Handle } from '@sveltejs/kit';
import { getSessionWithUser, getSessionCookieName } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize user and session as null
  event.locals.user = null;
  event.locals.session = null;

  // Get session cookie
  const sessionId = event.cookies.get(getSessionCookieName());
  
  // If there's a session ID and D1 is available, look up the user
  if (sessionId && event.platform?.env?.DB) {
    try {
      const result = await getSessionWithUser(event.platform.env.DB, sessionId);
      if (result) {
        event.locals.user = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatarUrl: result.user.avatarUrl
        };
        event.locals.session = {
          id: result.session.id,
          expiresAt: result.session.expiresAt
        };
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  }

  return resolve(event);
};

