import type { RestaurantLead } from "./types.js";

const grill =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=80";
const crudo =
  "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=2000&q=80";
const pasta =
  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=2000&q=80";
const market =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80";
const counter =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80";

export const SEED_LEADS: RestaurantLead[] = [
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000001",
    slug: "brasa-hollywood",
    name: "Brasa Hollywood",
    neighborhood: "Palermo Hollywood",
    owner_name: "Martín Herrera",
    owner_phone: "+5491155502101",
    ig_handle: "@brasahollywood",
    specialty: "parrilla de fuego lento",
    google_rating: 4.7,
    pain_point:
      "El salón se llena los viernes, pero el Instagram no toma reservas y las mesas se confirman tarde por DM.",
    hero_image_url: grill,
    menu_highlights: [
      {
        name: "Ojo de bife",
        description: "Corte grueso, salmuera de un día y brasa de quebracho hasta el punto.",
        price_ars: "$28.500",
      },
      {
        name: "Provoleta calchaquí",
        description: "Provolone fundido con orégano, ají molido y miel de caña.",
        price_ars: "$12.800",
      },
      {
        name: "Entraña al romero",
        description: "Fuego alto, jugo de limón y papas fritas en grasa de la casa.",
        price_ars: "$24.200",
      },
    ],
    status: "PENDING_OUTREACH",
  },
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000002",
    slug: "crudo-chacarita",
    name: "Crudo Chacarita",
    neighborhood: "Chacarita",
    owner_name: "Lucía Benedetti",
    owner_phone: "+5491155502102",
    ig_handle: "@crudochacarita",
    specialty: "crudo y vinos naturales",
    google_rating: 4.8,
    pain_point:
      "La carta cambia cada semana y el PDF que mandan por WhatsApp queda viejo antes del jueves.",
    hero_image_url: crudo,
    menu_highlights: [
      {
        name: "Tiradito de lenguado",
        description: "Leche de tigre de maracuyá, ají limo y cilantro.",
        price_ars: "$16.400",
      },
      {
        name: "Ostra del sur",
        description: "Tres piezas, mignonette de chalote y un blanco de Río Negro.",
        price_ars: "$18.900",
      },
      {
        name: "Tartar de ojo de bife",
        description: "Yema curada, alcaparras y papas paille.",
        price_ars: "$19.700",
      },
    ],
    status: "PENDING_OUTREACH",
  },
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000003",
    slug: "vermu-colegiales",
    name: "Vermú Colegiales",
    neighborhood: "Colegiales",
    owner_name: "Andrés Molina",
    owner_phone: "+5491155502103",
    ig_handle: "@vermucolegiales",
    specialty: "vermú de autor y pastas",
    google_rating: 4.6,
    pain_point:
      "El mediodía depende del boca a boca y no hay un lugar claro para reservar la barra.",
    hero_image_url: pasta,
    menu_highlights: [
      {
        name: "Vermú de la casa",
        description: "Infusión de ajenjo, naranja amarga y soda de sifón.",
        price_ars: "$7.200",
      },
      {
        name: "Sorrentinos de ossobuco",
        description: "Pasta fresca, ragú corto y gremolata.",
        price_ars: "$15.600",
      },
      {
        name: "Flan de naranja",
        description: "Caramelo justo y crema sin azúcar de más.",
        price_ars: "$6.400",
      },
    ],
    status: "PENDING_OUTREACH",
  },
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000004",
    slug: "oliva-belgrano",
    name: "Oliva Belgrano",
    neighborhood: "Belgrano",
    owner_name: "Camila Ríos",
    owner_phone: "+5491155502104",
    ig_handle: "@olivabelgrano",
    specialty: "cocina mediterránea de mercado",
    google_rating: 4.9,
    pain_point:
      "Las reseñas de Google crecen, pero nadie convierte esa atención en reservas de cena.",
    hero_image_url: market,
    menu_highlights: [
      {
        name: "Burrata y durazno",
        description: "Aceite de oliva, albahaca y pimienta negra.",
        price_ars: "$14.200",
      },
      {
        name: "Pulpo a la brasa",
        description: "Pimentón, papa chica y alioli de ajo negro.",
        price_ars: "$26.800",
      },
      {
        name: "Lubina al horno",
        description: "Hinojo, limón y manteca de anchoa.",
        price_ars: "$27.400",
      },
    ],
    status: "PENDING_OUTREACH",
  },
  {
    id: "8f1c0a10-1c1a-4a11-9a01-000000000005",
    slug: "taller-crespo",
    name: "Taller Crespo",
    neighborhood: "Villa Crespo",
    owner_name: "Diego Sosa",
    owner_phone: "+5491155502105",
    ig_handle: "@tallercrespo",
    specialty: "cocina de autor en barra",
    google_rating: 4.5,
    pain_point:
      "El menú degustación se explica de memoria y se pierden cubiertos cuando el mozo no está.",
    hero_image_url: counter,
    menu_highlights: [
      {
        name: "Degustación de cinco pasos",
        description: "Mercado del día, maridaje opcional, 90 minutos en la barra.",
        price_ars: "$42.000",
      },
      {
        name: "Pan de masa madre",
        description: "Manteca ahumada y sal en escamas.",
        price_ars: "$4.800",
      },
      {
        name: "Postre de maíz",
        description: "Helado de choclo, crumble y reducción de malbec.",
        price_ars: "$8.900",
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
