-- ============================================================
-- Buzzer Complete Supabase Setup Schema
-- Run this in your Supabase Project -> SQL Editor
-- ============================================================

-- 1. Create Private App Records Table for document storage
CREATE TABLE IF NOT EXISTS public.app_records (
  collection text NOT NULL,
  id text NOT NULL,
  document jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, id)
);

-- 2. Indexes for fast collection and JSON document querying
CREATE INDEX IF NOT EXISTS app_records_collection_idx
  ON public.app_records (collection);

CREATE INDEX IF NOT EXISTS app_records_document_gin_idx
  ON public.app_records USING gin (document jsonb_path_ops);

-- 3. Row Level Security & Service Role Grants
ALTER TABLE public.app_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_records FROM anon, authenticated;
GRANT ALL ON TABLE public.app_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_records TO service_role;

-- 4. Auth User Profile Synchronization Trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.app_records (collection, id, document)
  VALUES (
    'users',
    NEW.id::text,
    jsonb_build_object(
      'id', NEW.id::text,
      'email', NEW.email,
      'name', COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
      'role', 'user',
      'createdAt', NEW.created_at
    )
  )
  ON CONFLICT (collection, id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. Storage Bucket for Reels & Media
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'buzzer-reels',
  'buzzer-reels',
  true,
  52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
