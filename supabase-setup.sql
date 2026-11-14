CREATE TABLE public.products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, category text NOT NULL CHECK(category IN ('snacks','drinks')), price integer NOT NULL CHECK(price > 0), image text, available boolean NOT NULL DEFAULT true, position integer NOT NULL DEFAULT 0);
GRANT SELECT ON public.products TO anon, authenticated; GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_menu ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE TABLE public.sales (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid REFERENCES public.products(id) ON DELETE SET NULL, product_name text NOT NULL, quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 999), unit_price integer NOT NULL CHECK(unit_price > 0), created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.admin_attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.admin_attempts TO service_role;
ALTER TABLE public.admin_attempts ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.admin_sessions (token_hash text PRIMARY KEY, expires_at timestamptz NOT NULL);
GRANT ALL ON public.admin_sessions TO service_role;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX sales_created_at ON public.sales(created_at);
-- Produtos iniciais (foto vazia: o site usa as fotos do código)
INSERT INTO public.products (name, category, price, available, position) VALUES
('Coxinha', 'snacks', 400, true, 1),
('Mini hambúrguer', 'snacks', 800, true, 2),
('Mini pizza', 'snacks', 700, true, 3),
('Suco de Manga', 'drinks', 500, true, 4),
('Suco de Abacaxi', 'drinks', 500, true, 5),
('Suco de Goiaba', 'drinks', 500, true, 6),
('Suco de Maracujá', 'drinks', 500, true, 7);
