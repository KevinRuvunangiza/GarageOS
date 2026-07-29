-- ============================================================
-- GarageOS: Promo Code Engine Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code         TEXT PRIMARY KEY,
  type         TEXT NOT NULL CHECK (type IN ('lifetime', 'trial_14')),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  usage_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_codes_read_for_authenticated" ON public.promo_codes;

CREATE POLICY "promo_codes_read_for_authenticated"
  ON public.promo_codes
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Seed initial promo codes
INSERT INTO public.promo_codes (code, type)
VALUES
  ('CELMIS',     'lifetime'),
  ('KABEIROS',   'lifetime'),
  ('KAIROS',     'trial_14'),
  ('EPIMETHEUS', 'trial_14')
ON CONFLICT (code) DO NOTHING;

-- 3. Update garages table
ALTER TABLE public.garages
  ALTER COLUMN subscription_status DROP DEFAULT;

UPDATE public.garages
  SET subscription_status = 'pending'
  WHERE subscription_status NOT IN ('pending', 'active_lifetime', 'active_trial', 'expired');

ALTER TABLE public.garages
  DROP CONSTRAINT IF EXISTS garages_subscription_status_check;

ALTER TABLE public.garages
  ADD CONSTRAINT garages_subscription_status_check
  CHECK (subscription_status IN ('pending', 'active_lifetime', 'active_trial', 'expired'));

ALTER TABLE public.garages
  ALTER COLUMN subscription_status SET DEFAULT 'pending';

ALTER TABLE public.garages
  ADD COLUMN IF NOT EXISTS trial_ends_at      TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS applied_promo_code TEXT        NULL;

-- 4. Create RPC: apply_promo_code(garage_id, promo_code) -> JSONB
CREATE OR REPLACE FUNCTION public.apply_promo_code(
  garage_id    UUID,
  promo_code   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code   TEXT := UPPER(TRIM(promo_code));
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM public.promo_codes
  WHERE code = v_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired promo code.');
  END IF;

  IF v_record.type = 'lifetime' THEN
    UPDATE public.garages
    SET
      subscription_status = 'active_lifetime',
      trial_ends_at       = NULL,
      applied_promo_code  = v_code
    WHERE id = garage_id;
  ELSIF v_record.type = 'trial_14' THEN
    UPDATE public.garages
    SET
      subscription_status = 'active_trial',
      trial_ends_at       = NOW() + INTERVAL '14 days',
      applied_promo_code  = v_code
    WHERE id = garage_id;
  END IF;

  UPDATE public.promo_codes
  SET usage_count = usage_count + 1
  WHERE code = v_code;

  RETURN jsonb_build_object('success', true, 'type', v_record.type);
END;
$$;
