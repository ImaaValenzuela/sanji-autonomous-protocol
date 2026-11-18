-- Sanji Protocol: CABA restaurant leads.
-- Apply in the Supabase SQL editor. The gateway reads this table with the service role key.
-- The same five rooms ship in packages/database/src/seed.ts for zero-config demo mode.

create table if not exists public.caba_restaurants (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  neighborhood text not null,
  owner_name text not null,
  owner_phone text not null,
  ig_handle text not null,
  specialty text not null,
  google_rating numeric(2,1) not null,
  pain_point text not null,
  hero_image_url text not null,
  menu_highlights jsonb not null default '[]'::jsonb,
  status text not null default 'PENDING_OUTREACH'
    check (status in ('PENDING_OUTREACH', 'CONTACTED', 'PAID_EXPRESS', 'PAID_CORE', 'DEPLOYED')),
  last_tx_signature text,
  created_at timestamptz not null default now()
);

create index if not exists caba_restaurants_status_idx
  on public.caba_restaurants (status);

insert into public.caba_restaurants (
  id, slug, name, neighborhood, owner_name, owner_phone, ig_handle,
  specialty, google_rating, pain_point, hero_image_url, menu_highlights, status
) values
(
  '8f1c0a10-1c1a-4a11-9a01-000000000001',
  'brasa-hollywood',
  'Brasa Hollywood',
  'Palermo Hollywood',
  'Martín Herrera',
  '+5491155502101',
  '@brasahollywood',
  'parrilla de fuego lento',
  4.7,
  'El salón se llena los viernes, pero el Instagram no toma reservas y las mesas se confirman tarde por DM.',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Ojo de bife","description":"Corte grueso, salmuera de un día y brasa de quebracho hasta el punto.","price_ars":"$28.500"},
    {"name":"Provoleta calchaquí","description":"Provolone fundido con orégano, ají molido y miel de caña.","price_ars":"$12.800"},
    {"name":"Entraña al romero","description":"Fuego alto, jugo de limón y papas fritas en grasa de la casa.","price_ars":"$24.200"}
  ]'::jsonb,
  'PENDING_OUTREACH'
),
(
  '8f1c0a10-1c1a-4a11-9a01-000000000002',
  'crudo-chacarita',
  'Crudo Chacarita',
  'Chacarita',
  'Lucía Benedetti',
  '+5491155502102',
  '@crudochacarita',
  'crudo y vinos naturales',
  4.8,
  'La carta cambia cada semana y el PDF que mandan por WhatsApp queda viejo antes del jueves.',
  'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Tiradito de lenguado","description":"Leche de tigre de maracuyá, ají limo y cilantro.","price_ars":"$16.400"},
    {"name":"Ostra del sur","description":"Tres piezas, mignonette de chalote y un blanco de Río Negro.","price_ars":"$18.900"},
    {"name":"Tartar de ojo de bife","description":"Yema curada, alcaparras y papas paille.","price_ars":"$19.700"}
  ]'::jsonb,
  'PENDING_OUTREACH'
),
(
  '8f1c0a10-1c1a-4a11-9a01-000000000003',
  'vermu-colegiales',
  'Vermú Colegiales',
  'Colegiales',
  'Andrés Molina',
  '+5491155502103',
  '@vermucolegiales',
  'vermú de autor y pastas',
  4.6,
  'El mediodía depende del boca a boca y no hay un lugar claro para reservar la barra.',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Vermú de la casa","description":"Infusión de ajenjo, naranja amarga y soda de sifón.","price_ars":"$7.200"},
    {"name":"Sorrentinos de ossobuco","description":"Pasta fresca, ragú corto y gremolata.","price_ars":"$15.600"},
    {"name":"Flan de naranja","description":"Caramelo justo y crema sin azúcar de más.","price_ars":"$6.400"}
  ]'::jsonb,
  'PENDING_OUTREACH'
),
(
  '8f1c0a10-1c1a-4a11-9a01-000000000004',
  'oliva-belgrano',
  'Oliva Belgrano',
  'Belgrano',
  'Camila Ríos',
  '+5491155502104',
  '@olivabelgrano',
  'cocina mediterránea de mercado',
  4.9,
  'Las reseñas de Google crecen, pero nadie convierte esa atención en reservas de cena.',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Burrata y durazno","description":"Aceite de oliva, albahaca y pimienta negra.","price_ars":"$14.200"},
    {"name":"Pulpo a la brasa","description":"Pimentón, papa chica y alioli de ajo negro.","price_ars":"$26.800"},
    {"name":"Lubina al horno","description":"Hinojo, limón y manteca de anchoa.","price_ars":"$27.400"}
  ]'::jsonb,
  'PENDING_OUTREACH'
),
(
  '8f1c0a10-1c1a-4a11-9a01-000000000005',
  'taller-crespo',
  'Taller Crespo',
  'Villa Crespo',
  'Diego Sosa',
  '+5491155502105',
  '@tallercrespo',
  'cocina de autor en barra',
  4.5,
  'El menú degustación se explica de memoria y se pierden cubiertos cuando el mozo no está.',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Degustación de cinco pasos","description":"Mercado del día, maridaje opcional, 90 minutos en la barra.","price_ars":"$42.000"},
    {"name":"Pan de masa madre","description":"Manteca ahumada y sal en escamas.","price_ars":"$4.800"},
    {"name":"Postre de maíz","description":"Helado de choclo, crumble y reducción de malbec.","price_ars":"$8.900"}
  ]'::jsonb,
  'PENDING_OUTREACH'
)
on conflict (slug) do nothing;
