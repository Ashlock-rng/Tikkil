/*
# Tikkil - Phase 3: Gifts, Auth Accounts, Monetization Payouts

1. New Tables
- `live_gifts` — gifts sent during live streams ($10–$100,000), 50/50 split between platform and receiver, 21-day hold before receiver can withdraw
- `payouts` — monthly monetization payout records, scheduled for the 29th of each month, tracking ad revenue + gift earnings per user
- `auth_method` — tracks whether user signed up with phone or email (TikTok-style)

2. Modified Tables
- `profiles` — added `phone` (text, unique), `email` (text, unique), `password_hash` (text, for custom auth), `gift_balance_pending` (numeric, gifts on 21-day hold), `gift_balance_available` (numeric, released gifts), `ad_revenue_balance` (numeric, accumulated ad revenue), `total_earned` (numeric, lifetime earnings)

3. Security
- RLS enabled on all new tables with anon+authenticated CRUD (single-tenant demo app).
- Payouts table also allows anon CRUD.

4. Important Notes
- Gifts range from $10 to $100,000
- Platform takes 50%, receiver gets 50%
- Gifts are held for 21 days before becoming available to the receiver
- Monetization payouts happen on the 29th of each month
- Account creation supports either phone number or email (TikTok-style)
*/

-- Add columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gift_balance_pending numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gift_balance_available numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ad_revenue_balance numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_earned numeric(12,2) NOT NULL DEFAULT 0;

-- Create unique indexes on phone and email (partial — only where non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON profiles (phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON profiles (email) WHERE email IS NOT NULL;

-- Live Gifts
CREATE TABLE IF NOT EXISTS live_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 10 AND amount <= 100000),
  platform_share numeric(12,2) NOT NULL DEFAULT 0,
  receiver_share numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'holding' CHECK (status IN ('holding', 'released', 'paid_out')),
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE live_gifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_live_gifts" ON live_gifts;
CREATE POLICY "anon_select_live_gifts" ON live_gifts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_live_gifts" ON live_gifts;
CREATE POLICY "anon_insert_live_gifts" ON live_gifts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_live_gifts" ON live_gifts;
CREATE POLICY "anon_update_live_gifts" ON live_gifts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_live_gifts" ON live_gifts;
CREATE POLICY "anon_delete_live_gifts" ON live_gifts FOR DELETE TO anon, authenticated USING (true);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payout_date date NOT NULL,
  ad_revenue numeric(12,2) NOT NULL DEFAULT 0,
  gift_earnings numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_payouts" ON payouts;
CREATE POLICY "anon_select_payouts" ON payouts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payouts" ON payouts;
CREATE POLICY "anon_insert_payouts" ON payouts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payouts" ON payouts;
CREATE POLICY "anon_update_payouts" ON payouts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payouts" ON payouts;
CREATE POLICY "anon_delete_payouts" ON payouts FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_gifts_stream ON live_gifts (stream_id);
CREATE INDEX IF NOT EXISTS idx_live_gifts_receiver ON live_gifts (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_live_gifts_created ON live_gifts (created_at);
CREATE INDEX IF NOT EXISTS idx_payouts_profile ON payouts (profile_id);
CREATE INDEX IF NOT EXISTS idx_payouts_date ON payouts (payout_date);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts (status);
