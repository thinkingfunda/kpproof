CREATE TABLE public.parties (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, active boolean NOT NULL DEFAULT true, credit_limit numeric, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.product_rates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, rate_date date NOT NULL, rate numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (product_id, rate_date));
CREATE TABLE public.vehicles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), number text NOT NULL, party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL, tank_capacity numeric, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.fuel_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entry_date date NOT NULL, party_id uuid, party_name text NOT NULL, vehicle text NOT NULL, litres numeric NOT NULL, amount numeric NOT NULL, image text, product_id uuid, product_name text, rate numeric, signature text, shift text, ocr jsonb, verified boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());

DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['parties','products','product_rates','vehicles','fuel_entries'] LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "Open access (no login yet)" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
  EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
END LOOP; END $$;