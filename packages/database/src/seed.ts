import type { RestaurantLead } from "./types.js";

const grill =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=80";
const crudo =
  "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=2000&q=80";
const market =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80";
const counter =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80";
const steak =
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2000&q=80";
const pasta =
  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=2000&q=80";

export const SEED_LEADS: RestaurantLead[] = [
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000011",
    slug: "fuego-wynwood",
    name: "Fuego Wynwood",
    city: "Miami",
    country: "United States",
    region: "NA",
    language: "en",
    price_tier: "$$$$",
    owner_name: "Camila Duarte",
    owner_phone: "+13055550191",
    ig_handle: "@fuegowynwood",
    specialty: "wood-fired coastal grill",
    google_rating: 4.7,
    review_count: 842,
    hot_lead_score: 92,
    pain_point:
      "Friday books out in Instagram DMs and the host stand has no live waitlist.",
    hero_image_url: grill,
    menu_highlights: [
      {
        name: "Dry-aged ribeye",
        description: "45-day ribeye, smoked salt, and charred lemon.",
        price_ars: "$68",
      },
      {
        name: "Wood-fired prawns",
        description: "Gulf prawns, chili butter, and grilled sourdough.",
        price_ars: "$32",
      },
      {
        name: "Key lime pie",
        description: "Cold custard, torched meringue, and a short crust.",
        price_ars: "$14",
      },
    ],
    status: "PENDING_OUTREACH",
  },
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000012",
    slug: "crudo-salamanca",
    name: "Crudo Salamanca",
    city: "Madrid",
    country: "Spain",
    region: "EU",
    language: "es",
    price_tier: "$$$$",
    owner_name: "Ignacio Herrera",
    owner_phone: "+34611022033",
    ig_handle: "@crudosalama",
    specialty: "crudo y vinos naturales",
    google_rating: 4.8,
    review_count: 1264,
    hot_lead_score: 95,
    pain_point:
      "La carta cambia cada semana y el PDF que mandáis por WhatsApp queda viejo antes del jueves.",
    hero_image_url: crudo,
    menu_highlights: [
      {
        name: "Tiradito de corvina",
        description: "Leche de tigre de maracuyá, ají limo y cilantro.",
        price_ars: "24 €",
      },
      {
        name: "Ostra de O Grove",
        description: "Tres piezas y mignonette de chalota.",
        price_ars: "22 €",
      },
      {
        name: "Tartar de vaca madurada",
        description: "Yema curada, alcaparras y chips de patata.",
        price_ars: "26 €",
      },
    ],
    status: "PENDING_OUTREACH",
  },
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000013",
    slug: "brasa-polanco",
    name: "Brasa Polanco",
    city: "Mexico City",
    country: "Mexico",
    region: "LATAM",
    language: "es",
    price_tier: "$$$",
    owner_name: "Regina Solís",
    owner_phone: "+525555018833",
    ig_handle: "@brasapolanco",
    specialty: "parrilla de mercado",
    google_rating: 4.6,
    review_count: 2104,
    hot_lead_score: 88,
    pain_point:
      "Las reservaciones de corporativo se pierden entre el WhatsApp del host y las mesas que ya están sentadas.",
    hero_image_url: market,
    menu_highlights: [
      {
        name: "Ribeye al carbón",
        description: "Sal de Colima, cebollita asada y salsa de chile de árbol.",
        price_ars: "$890",
      },
      {
        name: "Elote de la casa",
        description: "Mayonesa de chile, queso cotija y limón.",
        price_ars: "$180",
      },
      {
        name: "Flan de rompope",
        description: "Caramelo oscuro y nuez garapiñada.",
        price_ars: "$160",
      },
    ],
    status: "PENDING_OUTREACH",
  },
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000014",
    slug: "counter-soho",
    name: "Counter Soho",
    city: "London",
    country: "United Kingdom",
    region: "EU",
    language: "en",
    price_tier: "$$$$",
    owner_name: "Eleanor Wright",
    owner_phone: "+442075550188",
    ig_handle: "@countersoho",
    specialty: "counter tasting",
    google_rating: 4.9,
    review_count: 640,
    hot_lead_score: 97,
    pain_point:
      "The tasting menu is explained from memory and covers walk when the floor lead is off.",
    hero_image_url: counter,
    menu_highlights: [
      {
        name: "Five-course counter",
        description: "Market menu, optional pairing, ninety minutes at the pass.",
        price_ars: "£95",
      },
      {
        name: "Sourdough and cultured butter",
        description: "Overnight loaf and smoked butter.",
        price_ars: "£7",
      },
      {
        name: "Brown butter tart",
        description: "Hazelnut, sea salt, and crème fraîche.",
        price_ars: "£12",
      },
    ],
    status: "PENDING_OUTREACH",
  },
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000015",
    slug: "ember-austin",
    name: "Ember Austin",
    city: "Austin",
    country: "United States",
    region: "NA",
    language: "en",
    price_tier: "$$$",
    owner_name: "Marcus Hale",
    owner_phone: "+15125550144",
    ig_handle: "@emberaustin",
    specialty: "live-fire steakhouse",
    google_rating: 4.5,
    review_count: 1872,
    hot_lead_score: 86,
    pain_point:
      "The weekend patio fills from walk-ins and the booking link on Google is a dead PDF.",
    hero_image_url: steak,
    menu_highlights: [
      {
        name: "Porterhouse for two",
        description: "Oak fire, bone marrow butter, and a sharp jus.",
        price_ars: "$128",
      },
      {
        name: "Smoked queso",
        description: "Hatch chile, warm tortillas, and pickled onion.",
        price_ars: "$16",
      },
      {
        name: "Peach cobbler",
        description: "Texas peaches, biscuit top, and buttermilk ice cream.",
        price_ars: "$13",
      },
    ],
    status: "PENDING_OUTREACH",
  },
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000016",
    slug: "brasa-palermo",
    name: "Brasa Palermo",
    city: "Buenos Aires",
    country: "Argentina",
    region: "LATAM",
    language: "es",
    price_tier: "$$$",
    owner_name: "Martín Herrera",
    owner_phone: "+5491155502101",
    ig_handle: "@brasapalermo",
    specialty: "parrilla de fuego lento",
    google_rating: 4.7,
    review_count: 980,
    hot_lead_score: 90,
    pain_point:
      "El salón se llena los viernes, pero Instagram no toma reservas y las mesas se confirman tarde por DM.",
    hero_image_url: pasta,
    menu_highlights: [
      {
        name: "Ojo de bife",
        description: "Corte grueso, salmuera de un día y brasa de quebracho.",
        price_ars: "$28.500",
      },
      {
        name: "Provoleta",
        description: "Orégano, ají molido y miel de caña.",
        price_ars: "$12.800",
      },
      {
        name: "Flan de naranja",
        description: "Caramelo justo y crema.",
        price_ars: "$6.400",
      },
    ],
    status: "PENDING_OUTREACH",
  },
];

export function cloneSeed(): RestaurantLead[] {
  return SEED_LEADS.map((lead) => ({
    ...lead,
    menu_highlights: lead.menu_highlights.map((item) => ({ ...item })),
  }));
}
