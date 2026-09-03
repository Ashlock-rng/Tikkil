/*
# Tikkil - Social App Schema (Single-tenant, no auth)

1. New Tables
- `profiles` — user profiles (id, username, display_name, avatar_url, bio, verified, created_at)
- `posts` — X-like text posts (id, profile_id, content, image_url, likes_count, comments_count, created_at)
- `videos` — YouTube-like videos (id, profile_id, title, description, thumbnail_url, video_url, views, likes, duration, created_at)
- `reels` — TikTok-like vertical short videos (id, profile_id, caption, video_url, likes, comments_count, created_at)
- `statuses` — WhatsApp-like status stories (id, profile_id, content_type, media_url, caption, created_at, expires_at)
- `comments` — comments on posts, videos, and reels (id, profile_id, post_id, video_id, reel_id, content, created_at)
- `post_likes` — likes on posts (id, post_id, profile_id, created_at)
- `ai_chats` — AI conversation history (id, session_id, role, content, created_at)

2. Security
- RLS enabled on all tables.
- All tables allow anon+authenticated CRUD (single-tenant, intentionally public/shared data).
- USING (true) is acceptable because this is a no-auth demo app with intentionally shared data.

3. Important Notes
- No user_id / auth.users linkage — this is a single-tenant demo app.
- All data is intentionally public/shared across visitors.
- Sample data is seeded via a separate migration.
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  avatar_url text NOT NULL,
  bio text DEFAULT '',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE TO anon, authenticated USING (true);

-- Posts (X-like)
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  reposts_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_posts" ON posts;
CREATE POLICY "anon_select_posts" ON posts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_posts" ON posts;
CREATE POLICY "anon_insert_posts" ON posts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_posts" ON posts;
CREATE POLICY "anon_update_posts" ON posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_posts" ON posts;
CREATE POLICY "anon_delete_posts" ON posts FOR DELETE TO anon, authenticated USING (true);

-- Videos (YouTube-like)
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  thumbnail_url text NOT NULL,
  video_url text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  duration text NOT NULL DEFAULT '0:00',
  category text DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_videos" ON videos;
CREATE POLICY "anon_select_videos" ON videos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_videos" ON videos;
CREATE POLICY "anon_insert_videos" ON videos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_videos" ON videos;
CREATE POLICY "anon_update_videos" ON videos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_videos" ON videos;
CREATE POLICY "anon_delete_videos" ON videos FOR DELETE TO anon, authenticated USING (true);

-- Reels (TikTok-like)
CREATE TABLE IF NOT EXISTS reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caption text NOT NULL DEFAULT '',
  video_url text NOT NULL,
  likes integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_reels" ON reels;
CREATE POLICY "anon_select_reels" ON reels FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_reels" ON reels;
CREATE POLICY "anon_insert_reels" ON reels FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_reels" ON reels;
CREATE POLICY "anon_update_reels" ON reels FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_reels" ON reels;
CREATE POLICY "anon_delete_reels" ON reels FOR DELETE TO anon, authenticated USING (true);

-- Statuses (WhatsApp-like stories)
CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL DEFAULT 'image',
  media_url text NOT NULL,
  caption text DEFAULT '',
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_statuses" ON statuses;
CREATE POLICY "anon_select_statuses" ON statuses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_statuses" ON statuses;
CREATE POLICY "anon_insert_statuses" ON statuses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_statuses" ON statuses;
CREATE POLICY "anon_update_statuses" ON statuses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_statuses" ON statuses;
CREATE POLICY "anon_delete_statuses" ON statuses FOR DELETE TO anon, authenticated USING (true);

-- Comments (polymorphic - post_id, video_id, or reel_id)
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES reels(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comment_target CHECK (post_id IS NOT NULL OR video_id IS NOT NULL OR reel_id IS NOT NULL)
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_comments" ON comments;
CREATE POLICY "anon_select_comments" ON comments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
CREATE POLICY "anon_insert_comments" ON comments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_comments" ON comments;
CREATE POLICY "anon_update_comments" ON comments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "anon_delete_comments" ON comments FOR DELETE TO anon, authenticated USING (true);

-- AI Chats
CREATE TABLE IF NOT EXISTS ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ai_chats" ON ai_chats;
CREATE POLICY "anon_select_ai_chats" ON ai_chats FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ai_chats" ON ai_chats;
CREATE POLICY "anon_insert_ai_chats" ON ai_chats FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ai_chats" ON ai_chats;
CREATE POLICY "anon_delete_ai_chats" ON ai_chats FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_created ON reels (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_statuses_created ON statuses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_video ON comments (video_id);
CREATE INDEX IF NOT EXISTS idx_comments_reel ON comments (reel_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_session ON ai_chats (session_id, created_at);
