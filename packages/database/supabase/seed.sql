-- Sanji Protocol: global high-ticket hospitality leads.
-- The app reads public.hospitality_leads. Apply this in the Supabase SQL editor.
-- The same six rooms ship in packages/database/src/seed.ts for zero-config demo mode.

create table if not exists public.hospitality_leads (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  city text not null,
  country text not null,
  region text not null check (region in ('NA', 'EU', 'LATAM')),
  language text not null check (language in ('en', 'es', 'pt', 'fr', 'it')),
  price_tier text not null check (price_tier in ('$$', '$$$', '$$$$')),
  owner_name text not null,
  owner_phone text not null,
  ig_handle text not null,
  specialty text not null,
  google_rating numeric(2,1) not null,
  review_count integer not null check (review_count >= 0),
  hot_lead_score integer not null check (hot_lead_score between 0 and 100),
  pain_point text not null,
  hero_image_url text not null,
  menu_highlights jsonb not null default '[]'::jsonb,
  status text not null default 'PENDING_OUTREACH'
    check (status in ('PENDING_OUTREACH', 'CONTACTED', 'PAID_EXPRESS', 'PAID_CORE', 'DEPLOYED')),
  last_tx_signature text,
  created_at timestamptz not null default now()
);

create index if not exists hospitality_leads_scout_idx
  on public.hospitality_leads (status, region, hot_lead_score desc);

insert into public.hospitality_leads (
  id, slug, name, city, country, region, language, price_tier,
  owner_name, owner_phone, ig_handle, specialty, google_rating,
  review_count, hot_lead_score, pain_point, hero_image_url, menu_highlights, status
) values
(
  '8f1c0a10-1c1a-4a11-9a01-000000000011',
  'fuego-wynwood',
  'Fuego Wynwood',
  'Miami',
  'United States',
  'NA',
  'en',
  '$$$$',
  'Camila Duarte',
  '+13055550191',
  '@fuegowynwood',
  'wood-fired coastal grill',
  4.7,
  842,
  92,
  'Friday books out in Instagram DMs and the host stand has no live waitlist.',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Dry-aged ribeye","description":"45-day ribeye, smoked salt, and charred lemon.","price_ars":"$68"},
    {"name":"Wood-fired prawns","description":"Gulf prawns, chili butter, and grilled sourdough.","price_ars":"$32"},
    {"name":"Key lime pie","description":"Cold custard, torched meringue, and a short crust.","price_ars":"$14"}
  ]'::jsonb,
  'PENDING_OUTREACH'
),
(
  '8f1c0a10-1c1a-4a11-9a01-000000000012',
  'crudo-salamanca',
  'Crudo Salamanca',
  'Madrid',
  'Spain',
  'EU',
  'es',
  '$$$$',
  'Ignacio Herrera',
  '+34611022033',
  '@crudosalama',
  'crudo y vinos naturales',
  4.8,
  1264,
  95,
  'La carta cambia cada semana y el PDF que mandáis por WhatsApp queda viejo antes del jueves.',
  'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Tiradito de corvina","description":"Leche de tigre de maracuyá, ají limo y cilantro.","price_ars":"24 €"},
    {"name":"Ostra de O Grove","description":"Tres piezas y mignonette de chalota.","price_ars":"22 €"},
    {"name":"Tartar de vaca madurada","description":"Yema curada, alcaparras y chips de patata.","price_ars":"26 €"}
  ]'::jsonb,
  'PENDING_OUTREACH'
),
(
  '8f1c0a10-1c1a-4a11-9a01-000000000013',
  'brasa-polanco',
  'Brasa Polanco',
  'Mexico City',
  'Mexico',
  'LATAM',
  'es',
  '$$$',
  'Regina Solís',
  '+525555018833',
  '@brasapolanco',
  'parrilla de mercado',
  4.6,
  2104,
  88,
  'Las reservaciones de corporativo se pierden entre el WhatsApp del host y las mesas que ya están sentadas.',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Ribeye al carbón","description":"Sal de Colima, cebollita asada y salsa de chile de árbol.","price_ars":"$890"},
    {"name":"Elote de la casa","description":"Mayonesa de chile, queso cotija y limón.","price_ars":"$180"},
    {"name":"Flan de rompope","description":"Caramelo oscuro y nuez garapiñada.","price_ars":"$160"}
  ]'::jsonb,
  'PENDING_OUTREACH'
),
(
  '8f1c0a10-1c1a-4a11-9a01-000000000014',
  'counter-soho',
  'Counter Soho',
  'London',
  'United Kingdom',
  'EU',
  'en',
  '$$$$',
  'Eleanor Wright',
  '+442075550188',
  '@countersoho',
  'counter tasting',
  4.9,
  640,
  97,
  'The tasting menu is explained from memory and covers walk when the floor lead is off.',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Five-course counter","description":"Market menu, optional pairing, ninety minutes at the pass.","price_ars":"£95"},
    {"name":"Sourdough and cultured butter","description":"Overnight loaf and smoked butter.","price_ars":"£7"},
    {"name":"Brown butter tart","description":"Hazelnut, sea salt, and crème fraîche.","price_ars":"£12"}
  ]'::jsonb,
  'PENDING_OUTREACH'
),
(
  '8f1c0a10-1c1a-4a11-9a01-000000000015',
  'ember-austin',
  'Ember Austin',
  'Austin',
  'United States',
  'NA',
  'en',
  '$$$',
  'Marcus Hale',
  '+15125550144',
  '@emberaustin',
  'live-fire steakhouse',
  4.5,
  1872,
  86,
  'The weekend patio fills from walk-ins and the booking link on Google is a dead PDF.',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Porterhouse for two","description":"Oak fire, bone marrow butter, and a sharp jus.","price_ars":"$128"},
    {"name":"Smoked queso","description":"Hatch chile, warm tortillas, and pickled onion.","price_ars":"$16"},
    {"name":"Peach cobbler","description":"Texas peaches, biscuit top, and buttermilk ice cream.","price_ars":"$13"}
  ]'::jsonb,
  'PENDING_OUTREACH'
),
(
  '8f1c0a10-1c1a-4a11-9a01-000000000016',
  'brasa-palermo',
  'Brasa Palermo',
  'Buenos Aires',
  'Argentina',
  'LATAM',
  'es',
  '$$$',
  'Martín Herrera',
  '+5491155502101',
  '@brasapalermo',
  'parrilla de fuego lento',
  4.7,
  980,
  90,
  'El salón se llena los viernes, pero Instagram no toma reservas y las mesas se confirman tarde por DM.',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=2000&q=80',
  '[
    {"name":"Ojo de bife","description":"Corte grueso, salmuera de un día y brasa de quebracho.","price_ars":"$28.500"},
    {"name":"Provoleta","description":"Orégano, ají molido y miel de caña.","price_ars":"$12.800"},
    {"name":"Flan de naranja","description":"Caramelo justo y crema.","price_ars":"$6.400"}
  ]'::jsonb,
  'PENDING_OUTREACH'
)
on conflict (slug) do nothing;
