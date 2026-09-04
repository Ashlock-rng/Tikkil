/*
# Tikkil - Phase 4: Production RLS + Auto-Profile Trigger + Ad Seed

1. Add profile_id column to ai_chats for ownership tracking
2. Auto-create profile trigger on auth.users insert
3. Replace all permissive RLS with proper ownership-based policies using auth.uid()
4. Create likes table for persisting likes
5. Seed 8 realistic advertisements
*/

ALTER TABLE ai_chats ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- AUTO-PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, verified, is_celebrity, is_adfree, is_admin, followers_count, preferred_language)
  VALUES (NEW.id, COALESCE(split_part(NEW.email, '@', 1), 'user_' || substr(NEW.id::text, 1, 8)), COALESCE(split_part(NEW.email, '@', 1), 'New User'), NEW.email, false, false, false, false, 0, 'en')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROFILES
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- POSTS
DROP POLICY IF EXISTS "anon_select_posts" ON posts;
DROP POLICY IF EXISTS "anon_insert_posts" ON posts;
DROP POLICY IF EXISTS "anon_update_posts" ON posts;
DROP POLICY IF EXISTS "anon_delete_posts" ON posts;
CREATE POLICY "posts_select_all" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert_own" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "posts_delete_own" ON posts FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- VIDEOS
DROP POLICY IF EXISTS "anon_select_videos" ON videos;
DROP POLICY IF EXISTS "anon_insert_videos" ON videos;
DROP POLICY IF EXISTS "anon_update_videos" ON videos;
DROP POLICY IF EXISTS "anon_delete_videos" ON videos;
CREATE POLICY "videos_select_all" ON videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "videos_insert_own" ON videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "videos_update_own" ON videos FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "videos_delete_own" ON videos FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- REELS
DROP POLICY IF EXISTS "anon_select_reels" ON reels;
DROP POLICY IF EXISTS "anon_insert_reels" ON reels;
DROP POLICY IF EXISTS "anon_update_reels" ON reels;
DROP POLICY IF EXISTS "anon_delete_reels" ON reels;
CREATE POLICY "reels_select_all" ON reels FOR SELECT TO authenticated USING (true);
CREATE POLICY "reels_insert_own" ON reels FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "reels_update_own" ON reels FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "reels_delete_own" ON reels FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- STATUSES
DROP POLICY IF EXISTS "anon_select_statuses" ON statuses;
DROP POLICY IF EXISTS "anon_insert_statuses" ON statuses;
DROP POLICY IF EXISTS "anon_update_statuses" ON statuses;
DROP POLICY IF EXISTS "anon_delete_statuses" ON statuses;
CREATE POLICY "statuses_select_all" ON statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "statuses_insert_own" ON statuses FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "statuses_update_own" ON statuses FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "statuses_delete_own" ON statuses FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- COMMENTS
DROP POLICY IF EXISTS "anon_select_comments" ON comments;
DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
DROP POLICY IF EXISTS "anon_update_comments" ON comments;
DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "comments_select_all" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_own" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "comments_update_own" ON comments FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "comments_delete_own" ON comments FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- AI_CHATS
DROP POLICY IF EXISTS "anon_select_ai_chats" ON ai_chats;
DROP POLICY IF EXISTS "anon_insert_ai_chats" ON ai_chats;
DROP POLICY IF EXISTS "anon_delete_ai_chats" ON ai_chats;
CREATE POLICY "ai_chats_select_own" ON ai_chats FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "ai_chats_insert_own" ON ai_chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "ai_chats_delete_own" ON ai_chats FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- LIKES TABLE
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES reels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, post_id),
  UNIQUE(profile_id, video_id),
  UNIQUE(profile_id, reel_id)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select_all" ON likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert_own" ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "likes_delete_own" ON likes FOR DELETE TO authenticated USING (auth.uid() = profile_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_video ON likes (video_id);
CREATE INDEX IF NOT EXISTS idx_likes_reel ON likes (reel_id);
CREATE INDEX IF NOT EXISTS idx_likes_profile ON likes (profile_id);

-- USER_BADGES
DROP POLICY IF EXISTS "anon_select_user_badges" ON user_badges;
DROP POLICY IF EXISTS "anon_insert_user_badges" ON user_badges;
DROP POLICY IF EXISTS "anon_update_user_badges" ON user_badges;
DROP POLICY IF EXISTS "anon_delete_user_badges" ON user_badges;
CREATE POLICY "user_badges_select_own" ON user_badges FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "user_badges_insert_own" ON user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

-- USER_FOLLOWERS
DROP POLICY IF EXISTS "anon_select_user_followers" ON user_followers;
DROP POLICY IF EXISTS "anon_insert_user_followers" ON user_followers;
DROP POLICY IF EXISTS "anon_delete_user_followers" ON user_followers;
CREATE POLICY "followers_select_all" ON user_followers FOR SELECT TO authenticated USING (true);
CREATE POLICY "followers_insert_own" ON user_followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "followers_delete_own" ON user_followers FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- FRIEND_REQUESTS
DROP POLICY IF EXISTS "anon_select_friend_requests" ON friend_requests;
DROP POLICY IF EXISTS "anon_insert_friend_requests" ON friend_requests;
DROP POLICY IF EXISTS "anon_update_friend_requests" ON friend_requests;
DROP POLICY IF EXISTS "anon_delete_friend_requests" ON friend_requests;
CREATE POLICY "friend_requests_select_participants" ON friend_requests FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "friend_requests_insert_sender" ON friend_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "friend_requests_update_receiver" ON friend_requests FOR UPDATE TO authenticated USING (auth.uid() = receiver_id OR auth.uid() = sender_id) WITH CHECK (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- DIRECT_MESSAGES
DROP POLICY IF EXISTS "anon_select_dms" ON direct_messages;
DROP POLICY IF EXISTS "anon_insert_dms" ON direct_messages;
DROP POLICY IF EXISTS "anon_delete_dms" ON direct_messages;
CREATE POLICY "dms_select_participants" ON direct_messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "dms_insert_sender" ON direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "dms_delete_own" ON direct_messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- LIVE_STREAMS
DROP POLICY IF EXISTS "anon_select_live_streams" ON live_streams;
DROP POLICY IF EXISTS "anon_insert_live_streams" ON live_streams;
DROP POLICY IF EXISTS "anon_update_live_streams" ON live_streams;
DROP POLICY IF EXISTS "anon_delete_live_streams" ON live_streams;
CREATE POLICY "live_streams_select_all" ON live_streams FOR SELECT TO authenticated USING (true);
CREATE POLICY "live_streams_insert_host" ON live_streams FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "live_streams_update_host" ON live_streams FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "live_streams_delete_host" ON live_streams FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- LIVE_VIEWERS
DROP POLICY IF EXISTS "anon_select_live_viewers" ON live_viewers;
DROP POLICY IF EXISTS "anon_insert_live_viewers" ON live_viewers;
DROP POLICY IF EXISTS "anon_delete_live_viewers" ON live_viewers;
CREATE POLICY "live_viewers_select_all" ON live_viewers FOR SELECT TO authenticated USING (true);
CREATE POLICY "live_viewers_insert_own" ON live_viewers FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "live_viewers_delete_own" ON live_viewers FOR DELETE TO authenticated USING (auth.uid() = viewer_id);

-- ADVERTISEMENTS
DROP POLICY IF EXISTS "anon_select_ads" ON advertisements;
DROP POLICY IF EXISTS "anon_insert_ads" ON advertisements;
DROP POLICY IF EXISTS "anon_update_ads" ON advertisements;
DROP POLICY IF EXISTS "anon_delete_ads" ON advertisements;
CREATE POLICY "ads_select_all" ON advertisements FOR SELECT TO authenticated USING (true);

-- AD_IMPRESSIONS
DROP POLICY IF EXISTS "anon_select_ad_impressions" ON ad_impressions;
DROP POLICY IF EXISTS "anon_insert_ad_impressions" ON ad_impressions;
DROP POLICY IF EXISTS "anon_delete_ad_impressions" ON ad_impressions;
CREATE POLICY "ad_impressions_select_all" ON ad_impressions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ad_impressions_insert_all" ON ad_impressions FOR INSERT TO authenticated WITH CHECK (true);

-- LIVE_GIFTS
DROP POLICY IF EXISTS "anon_select_live_gifts" ON live_gifts;
DROP POLICY IF EXISTS "anon_insert_live_gifts" ON live_gifts;
DROP POLICY IF EXISTS "anon_update_live_gifts" ON live_gifts;
DROP POLICY IF EXISTS "anon_delete_live_gifts" ON live_gifts;
CREATE POLICY "live_gifts_select_participants" ON live_gifts FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "live_gifts_insert_sender" ON live_gifts FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- PAYOUTS
DROP POLICY IF EXISTS "anon_select_payouts" ON payouts;
DROP POLICY IF EXISTS "anon_insert_payouts" ON payouts;
DROP POLICY IF EXISTS "anon_update_payouts" ON payouts;
DROP POLICY IF EXISTS "anon_delete_payouts" ON payouts;
CREATE POLICY "payouts_select_own" ON payouts FOR SELECT TO authenticated USING (auth.uid() = profile_id);

-- ADMIN_ACTIONS
DROP POLICY IF EXISTS "anon_select_admin_actions" ON admin_actions;
DROP POLICY IF EXISTS "anon_insert_admin_actions" ON admin_actions;
CREATE POLICY "admin_actions_select_admin" ON admin_actions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- SEED 8 ADS
INSERT INTO advertisements (title, description, image_url, target_url, ad_type, duration_seconds, is_active) VALUES
('TechPro Wireless Headphones', 'Premium noise-cancelling headphones with 40hr battery life. Free shipping worldwide.', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://example.com/techpro', 'skippable', 5, true),
('FreshFit Meal Kit Delivery', 'Chef-prepared healthy meals delivered weekly. 50% off your first box today.', 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://example.com/freshfit', 'display', 5, true),
('WanderLast Travel Deals', 'Book your dream vacation - up to 60% off flights and hotels worldwide.', 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://example.com/wanderlast', 'skippable', 5, true),
('GlowUp Skincare Routine', 'Dermatologist-approved skincare. Visible results in 2 weeks or your money back.', 'https://images.pexels.com/photos/3383718/pexels-photo-3383718.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://example.com/glowup', 'display', 5, true),
('GameZone Cloud Gaming', 'Play the latest AAA games on any device. No console needed. Start free trial.', 'https://images.pexels.com/photos/371933/pexels-photo-371933.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://example.com/gamezone', 'skippable', 5, true),
('EduMaster Online Courses', '10,000+ courses from world-class instructors. Learn anything, anywhere.', 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://example.com/edumaster', 'display', 5, true),
('FitPulse Smartwatch', 'Track your heart rate, sleep, and workouts. Water-resistant. Now 30% off.', 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://example.com/fitpulse', 'skippable', 5, true),
('BrewCraft Coffee Subscription', 'Freshly roasted specialty coffee delivered to your door every week. First bag free.', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://example.com/brewcraft', 'display', 5, true)
ON CONFLICT DO NOTHING;
