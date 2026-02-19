/**
 * Simple authentication service using Google OAuth
 * Works with Cloudflare D1 for session storage
 */

import { nanoid } from 'nanoid';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

const SESSION_COOKIE_NAME = 'ozcuk_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent'
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; idToken: string }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  const data = await response.json() as { access_token: string; id_token: string };
  return { accessToken: data.access_token, idToken: data.id_token };
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture: string;
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json() as Promise<{ id: string; email: string; name: string; picture: string }>;
}

/**
 * Create or update user in database
 */
export async function upsertUser(
  db: D1Database,
  googleUser: { id: string; email: string; name: string; picture: string }
): Promise<User> {
  const userId = `google_${googleUser.id}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO users (id, email, name, avatar_url, provider, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'google', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      avatar_url = excluded.avatar_url,
      updated_at = excluded.updated_at
  `).bind(userId, googleUser.email, googleUser.name, googleUser.picture, now, now).run();

  return {
    id: userId,
    email: googleUser.email,
    name: googleUser.name,
    avatarUrl: googleUser.picture,
    provider: 'google',
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

/**
 * Create a new session for user
 */
export async function createSession(db: D1Database, userId: string): Promise<Session> {
  const sessionId = nanoid(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(sessionId, userId, expiresAt.toISOString(), now.toISOString()).run();

  return { id: sessionId, userId, expiresAt, createdAt: now };
}

/**
 * Get session and user from session ID
 */
export async function getSessionWithUser(
  db: D1Database,
  sessionId: string
): Promise<{ session: Session; user: User } | null> {
  const result = await db.prepare(`
    SELECT s.id as session_id, s.user_id, s.expires_at, s.created_at as session_created,
           u.id as user_id, u.email, u.name, u.avatar_url, u.provider,
           u.created_at as user_created, u.updated_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first<any>();

  if (!result) return null;

  return {
    session: {
      id: result.session_id,
      userId: result.user_id,
      expiresAt: new Date(result.expires_at),
      createdAt: new Date(result.session_created)
    },
    user: {
      id: result.user_id,
      email: result.email,
      name: result.name,
      avatarUrl: result.avatar_url,
      provider: result.provider,
      createdAt: new Date(result.user_created),
      updatedAt: new Date(result.updated_at)
    }
  };
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

/**
 * Get session cookie name
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

/**
 * Create session cookie options
 */
export function getSessionCookieOptions(expiresAt: Date): {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  expires: Date;
} {
  return {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: expiresAt
  };
}

