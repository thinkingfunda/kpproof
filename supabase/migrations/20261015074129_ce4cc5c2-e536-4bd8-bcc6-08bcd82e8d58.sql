CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_date date NOT NULL,
  party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
  party_name text NOT NULL,
  amount numeric NOT NULL,
  tds numeric NOT NULL DEFAULT 0,
  tcs numeric NOT NULL DEFAULT 0,
  final_amount numeric NOT NULL,
  remark text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO anon, authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open payments" ON public.payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;