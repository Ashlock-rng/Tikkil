/*
# Tikkil - Phase 2: Badges, DMs, Live, Monetization, Ads, Languages, Admin

1. New Tables
- `user_badges` — tracks celebrity (yellow, $8) and ad-free (blue, $5) badge purchases with admin approval status
- `user_followers` — follower relationships between profiles (for 5k follower livestream eligibility)
- `direct_messages` — 1-on-1 chat messages between users
- `friend_requests` — send/accept/report friend requests before DMing
- `live_streams` — live stream sessions (only for verified users with 5k+ followers)
- `live_viewers` — tracks viewers in a live stream
- `advertisements` — ad content shown in watch and reels (with monetization split data)
- `ad_impressions` — tracks ad views per video/reel for monetization calculation
- `user_languages` — language preference per user
- `admin_actions` — audit log of admin decisions (badge approvals/rejections, user bans, etc.)

2. Modified Tables
- `profiles` — added `followers_count`, `is_celebrity`, `is_adfree`, `is_admin`, `stripe_customer_id` columns

3. Security
- RLS enabled on all new tables with anon+authenticated CRUD (single-tenant demo).
- Admin actions table also allows anon CRUD (demo admin panel).

4. Important Notes
- Celebrity badge = yellow, $8, requires admin verification approval
- Ad-free badge = blue, $5, removes all ads for that user
- Verified users with 5k+ followers can start live streams
- 40% of ad revenue from a celebrity's video goes to that celebrity
- Multi-language support: English, Spanish, French, German, Portuguese, Arabic, Hindi, Chinese, Japanese, Korean
*/

-- Add columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_celebrity boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_adfree boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type text NOT NULL CHECK (badge_type IN ('celebrity', 'adfree')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  stripe_payment_id text,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_user_badges" ON user_badges;
CREATE POLICY "anon_select_user_badges" ON user_badges FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_user_badges" ON user_badges;
CREATE POLICY "anon_insert_user_badges" ON user_badges FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_user_badges" ON user_badges;
CREATE POLICY "anon_update_user_badges" ON user_badges FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_user_badges" ON user_badges;
CREATE POLICY "anon_delete_user_badges" ON user_badges FOR DELETE TO anon, authenticated USING (true);

-- User Followers
CREATE TABLE IF NOT EXISTS user_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_user_followers" ON user_followers;
CREATE POLICY "anon_select_user_followers" ON user_followers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_user_followers" ON user_followers;
CREATE POLICY "anon_insert_user_followers" ON user_followers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_user_followers" ON user_followers;
CREATE POLICY "anon_delete_user_followers" ON user_followers FOR DELETE TO anon, authenticated USING (true);

-- Friend Requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'reported')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_friend_requests" ON friend_requests;
CREATE POLICY "anon_select_friend_requests" ON friend_requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_friend_requests" ON friend_requests;
CREATE POLICY "anon_insert_friend_requests" ON friend_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_friend_requests" ON friend_requests;
CREATE POLICY "anon_update_friend_requests" ON friend_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_friend_requests" ON friend_requests;
CREATE POLICY "anon_delete_friend_requests" ON friend_requests FOR DELETE TO anon, authenticated USING (true);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_dms" ON direct_messages;
CREATE POLICY "anon_select_dms" ON direct_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dms" ON direct_messages;
CREATE POLICY "anon_insert_dms" ON direct_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dms" ON direct_messages;
CREATE POLICY "anon_delete_dms" ON direct_messages FOR DELETE TO anon, authenticated USING (true);

-- Live Streams
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  stream_url text NOT NULL DEFAULT '',
  viewer_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_live_streams" ON live_streams;
CREATE POLICY "anon_select_live_streams" ON live_streams FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_live_streams" ON live_streams;
CREATE POLICY "anon_insert_live_streams" ON live_streams FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_live_streams" ON live_streams;
CREATE POLICY "anon_update_live_streams" ON live_streams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_live_streams" ON live_streams;
CREATE POLICY "anon_delete_live_streams" ON live_streams FOR DELETE TO anon, authenticated USING (true);

-- Live Viewers
CREATE TABLE IF NOT EXISTS live_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(stream_id, viewer_id)
);
ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_live_viewers" ON live_viewers;
CREATE POLICY "anon_select_live_viewers" ON live_viewers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_live_viewers" ON live_viewers;
CREATE POLICY "anon_insert_live_viewers" ON live_viewers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_live_viewers" ON live_viewers;
CREATE POLICY "anon_delete_live_viewers" ON live_viewers FOR DELETE TO anon, authenticated USING (true);

-- Advertisements
CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text NOT NULL,
  target_url text NOT NULL DEFAULT '#',
  ad_type text NOT NULL DEFAULT 'display' CHECK (ad_type IN ('display', 'video', 'skippable')),
  duration_seconds integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ads" ON advertisements;
CREATE POLICY "anon_select_ads" ON advertisements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ads" ON advertisements;
CREATE POLICY "anon_insert_ads" ON advertisements FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ads" ON advertisements;
CREATE POLICY "anon_update_ads" ON advertisements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ads" ON advertisements;
CREATE POLICY "anon_delete_ads" ON advertisements FOR DELETE TO anon, authenticated USING (true);

-- Ad Impressions (for monetization tracking)
CREATE TABLE IF NOT EXISTS ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('video', 'reel')),
  content_id uuid NOT NULL,
  content_owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  revenue numeric(10,4) NOT NULL DEFAULT 0.01,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ad_impressions" ON ad_impressions;
CREATE POLICY "anon_select_ad_impressions" ON ad_impressions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ad_impressions" ON ad_impressions;
CREATE POLICY "anon_insert_ad_impressions" ON ad_impressions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ad_impressions" ON ad_impressions;
CREATE POLICY "anon_delete_ad_impressions" ON ad_impressions FOR DELETE TO anon, authenticated USING (true);

-- Admin Actions (audit log)
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('approve_badge', 'reject_badge', 'ban_user', 'unban_user', 'feature_content', 'remove_content')),
  target_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_badge_id uuid REFERENCES user_badges(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_admin_actions" ON admin_actions;
CREATE POLICY "anon_select_admin_actions" ON admin_actions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_admin_actions" ON admin_actions;
CREATE POLICY "anon_insert_admin_actions" ON admin_actions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_profile ON user_badges (profile_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_status ON user_badges (status);
CREATE INDEX IF NOT EXISTS idx_followers_following ON user_followers (following_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_dms_receiver ON direct_messages (receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_dms_sender ON direct_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_live_active ON live_streams (is_active);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_owner ON ad_impressions (content_owner_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_content ON ad_impressions (content_type, content_id);
