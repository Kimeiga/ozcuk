-- Özcük Database Schema
-- Users, Notes, and Word Lists

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL DEFAULT 'google',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for auth sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Word notes - personal notes attached to dictionary words
CREATE TABLE IF NOT EXISTS word_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, word)
);

-- Word lists - custom collections of words
CREATE TABLE IF NOT EXISTS word_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Word list items - words in a list
CREATE TABLE IF NOT EXISTS word_list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  mastery_level INTEGER DEFAULT 0, -- 0-5 for spaced repetition
  last_reviewed_at DATETIME,
  next_review_at DATETIME,
  UNIQUE(list_id, word)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_word_notes_user_word ON word_notes(user_id, word);
CREATE INDEX IF NOT EXISTS idx_word_lists_user_id ON word_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_word_list_items_list_id ON word_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_word_list_items_next_review ON word_list_items(next_review_at);

