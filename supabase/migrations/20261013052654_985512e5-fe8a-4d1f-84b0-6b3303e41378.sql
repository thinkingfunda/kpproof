CREATE OR REPLACE FUNCTION public.sync_party_name() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.fuel_entries SET party_name = NEW.name WHERE party_id = NEW.id OR (party_id IS NULL AND party_name = OLD.name);
  END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_sync_party_name AFTER UPDATE ON public.parties FOR EACH ROW EXECUTE FUNCTION public.sync_party_name();

CREATE OR REPLACE FUNCTION public.sync_product_name() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.fuel_entries SET product_name = NEW.name WHERE product_id = NEW.id OR (product_id IS NULL AND product_name = OLD.name);
  END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_sync_product_name AFTER UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.sync_product_name();

CREATE OR REPLACE FUNCTION public.sync_vehicle_number() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.number IS DISTINCT FROM OLD.number THEN
    UPDATE public.fuel_entries SET vehicle = NEW.number WHERE upper(vehicle) = upper(OLD.number);
  END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_sync_vehicle_number AFTER UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_number();

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_party_id_fkey;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE SET NULL;