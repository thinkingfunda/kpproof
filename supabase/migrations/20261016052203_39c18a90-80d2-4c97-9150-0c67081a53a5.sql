CREATE TABLE public.gemini_keys (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_name text NOT NULL, api_key text NOT NULL, exhausted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.gemini_keys TO service_role;
ALTER TABLE public.gemini_keys ENABLE ROW LEVEL SECURITY;