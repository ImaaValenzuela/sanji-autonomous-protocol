import type { RestaurantLead } from "@sanji/database";
import axios from "axios";

export interface Pitch {
  message: string;
  source: "grok" | "template";
  whatsappUrl: string;
  voice: VoiceId;
}

type VoiceId = "en-us" | "en-gb" | "es-es" | "es-mx" | "es-ar" | "pt-br" | "pt-pt" | "fr" | "it";

const OFFERS = {
  express: "Sanji Express ($290 USD)",
  core: "Sanji Autonomous Core ($1,200 USD)",
};

function previewUrl(slug: string): string {
  const base = process.env.PREVIEW_ENGINE_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/preview/${slug}`;
}

function firstName(owner: string): string {
  const name = owner.trim().split(/\s+/)[0];
  return name || owner;
}

function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function voiceFor(lead: RestaurantLead): VoiceId {
  const country = fold(lead.country);
  const city = fold(lead.city);
  if (lead.language === "en") {
    if (country.includes("kingdom") || country === "uk" || city === "london") return "en-gb";
    return "en-us";
  }
  if (lead.language === "es") {
    if (country.includes("spain") || country.includes("espana") || city === "madrid") return "es-es";
    if (country.includes("mexico") || city.includes("mexico")) return "es-mx";
    if (country.includes("argentina") || city.includes("aires")) return "es-ar";
    return "es-es";
  }
  if (lead.language === "pt") {
    return country.includes("portugal") ? "pt-pt" : "pt-br";
  }
  if (lead.language === "fr") return "fr";
  if (lead.language === "it") return "it";
  return "en-us";
}

function soften(pain: string): string {
  const trimmed = pain.trim().replace(/\.$/, "");
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function houseTemplate(lead: RestaurantLead, voice: VoiceId): string {
  const url = previewUrl(lead.slug);
  const who = firstName(lead.owner_name);
  const pain = soften(lead.pain_point);
  const place = `${lead.name} (${lead.city})`;

  if (voice === "en-gb") {
    return [
      `${who}, straight to it: ${pain}.`,
      `The page for ${place} is live, with the menu and a booking button: ${url}`,
      `${OFFERS.express}, one payment: a custom landing page, GSAP motion, a digital menu, and WhatsApp table booking.`,
      `${OFFERS.core} setup: an AI reservation concierge, CRM, review engine, and POS integration.`,
      "If you want it on your own domain, reply on this chat.",
    ].join("\n");
  }

  if (voice === "en-us") {
    return [
      `${who}, quick one: ${pain}.`,
      `I put a live page up for ${place}, menu and booking button included: ${url}`,
      `${OFFERS.express}, one time: a custom landing page, GSAP motion, a digital menu, and WhatsApp table booking.`,
      `${OFFERS.core} setup: an AI reservation concierge, CRM, review engine, and POS integration.`,
      "If that leak is the one that matters, reply here and we turn it on this week.",
    ].join("\n");
  }

  if (voice === "es-es") {
    return [
      `${who}, te lo digo directo: ${pain}.`,
      `Te dejé la página de ${place} con la carta y la reserva: ${url}`,
      `${OFFERS.express}, un solo pago: landing a medida, animaciones GSAP, carta digital y reserva por WhatsApp.`,
      `${OFFERS.core} de puesta en marcha: conserje de reservas con IA, CRM, motor de reseñas e integración con el TPV.`,
      "Si te encaja, respóndeme por aquí y lo dejamos esta semana.",
    ].join("\n");
  }

  if (voice === "es-mx") {
    return [
      `${who}, te hablo directo: ${pain}.`,
      `Ya está la página de ${place} con el menú y el botón de reservación: ${url}`,
      `${OFFERS.express}, un solo pago: landing a la medida, animaciones GSAP, menú digital y reservación por WhatsApp.`,
      `${OFFERS.core} de setup: conserje de reservaciones con IA, CRM, motor de reseñas e integración con el POS.`,
      "Si te late, contéstame por aquí y lo dejamos esta semana.",
    ].join("\n");
  }

  if (voice === "es-ar") {
    return [
      `${who}, mirá: ${pain}.`,
      `Te dejé la página de ${place} con la carta y el botón de reserva: ${url}`,
      `${OFFERS.express}, una sola vez: landing a medida, animaciones GSAP, menú digital y reserva directa por WhatsApp.`,
      `${OFFERS.core} de setup: conserje de reservas con IA, CRM, motor de reseñas e integración con el POS.`,
      "Si te cierra, respondé este mensaje y lo dejamos andando esta semana.",
    ].join("\n");
  }

  if (voice === "pt-pt") {
    return [
      `${who}, direto: ${pain}.`,
      `Deixei a página de ${place} no ar, com a carta e a reserva: ${url}`,
      `${OFFERS.express}, pagamento único: landing à medida, animações GSAP, carta digital e reserva por WhatsApp.`,
      `${OFFERS.core} de arranque: concierge de reservas com IA, CRM, motor de avaliações e integração com o POS.`,
      "Se fizer sentido, responda nesta conversa e deixamos isto a funcionar esta semana.",
    ].join("\n");
  }

  if (voice === "pt-br") {
    return [
      `${who}, direto: ${pain}.`,
      `Deixei a página de ${place} no ar, com o cardápio e a reserva: ${url}`,
      `${OFFERS.express}, pagamento único: landing sob medida, animações GSAP, cardápio digital e reserva por WhatsApp.`,
      `${OFFERS.core} de setup: concierge de reservas com IA, CRM, motor de avaliações e integração com o PDV.`,
      "Se fizer sentido, responde aqui e a gente deixa no ar esta semana.",
    ].join("\n");
  }

  if (voice === "fr") {
    return [
      `${who}, sans détour : ${pain}.`,
      `La page de ${place} est en ligne, carte et réservation : ${url}`,
      `${OFFERS.express}, paiement unique : landing sur mesure, animations GSAP, carte digitale et réservation WhatsApp.`,
      `${OFFERS.core} de mise en place : concierge de réservations avec IA, CRM, moteur d'avis et intégration POS.`,
      "Si ça vous va, répondez sur ce fil et on le met en ligne cette semaine.",
    ].join("\n");
  }

  return [
    `${who}, senza giri: ${pain}.`,
    `La pagina di ${place} è online, menu e prenotazione: ${url}`,
    `${OFFERS.express}, una tantum: landing su misura, animazioni GSAP, menu digitale e prenotazione WhatsApp.`,
    `${OFFERS.core} di setup: concierge prenotazioni con IA, CRM, motore recensioni e integrazione POS.`,
    "Se ti torna, rispondi qui e la accendiamo questa settimana.",
  ].join("\n");
}

const SYSTEM: Record<VoiceId, string> = {
  "en-us":
    "You are Sanji's SDR writing one WhatsApp to a US restaurant owner. American English, direct, no fluff, no emoji, no markdown. Max 700 characters. Name the specific operational pain, the live preview URL, Sanji Express at $290 USD one-time (custom landing, GSAP, digital menu, WhatsApp booking), and Sanji Autonomous Core at $1,200 USD setup (AI reservation concierge, CRM, review engine, POS). Ask for a reply in this chat.",
  "en-gb":
    "You are Sanji's SDR writing one WhatsApp to a London restaurant owner. British English, plain and specific, no emoji, no markdown. Max 700 characters. Name the operational pain, the live preview URL, Sanji Express at $290 USD one-time (custom landing, GSAP, digital menu, WhatsApp booking), and Sanji Autonomous Core at $1,200 USD setup (AI reservation concierge, CRM, review engine, POS). Ask them to reply on this chat.",
  "es-es":
    "Eres el SDR de Sanji. Un solo WhatsApp en español de España, con tú, sin voseo, sin emojis, sin markdown. Máximo 700 caracteres. Incluye el dolor concreto del local, la URL de la preview, Sanji Express a 290 USD en un pago (landing, GSAP, carta digital y reserva por WhatsApp) y Sanji Autonomous Core a 1.200 USD de puesta en marcha (conserje de reservas con IA, CRM, reseñas y TPV). Cierra pidiendo respuesta en este chat.",
  "es-mx":
    "Eres el SDR de Sanji. Un solo WhatsApp en español de México, con tú, sin voseo, sin emojis, sin markdown. Máximo 700 caracteres. Incluye el dolor concreto del restaurante, la URL de la preview, Sanji Express a 290 USD en un solo pago (landing, GSAP, menú digital y reservación por WhatsApp) y Sanji Autonomous Core a 1,200 USD de setup (conserje de reservaciones con IA, CRM, reseñas y POS). Cierra pidiendo que contesten en este chat.",
  "es-ar":
    "Sos el SDR de Sanji. Un solo WhatsApp en español rioplatense, con voseo, sin emojis, sin markdown. Máximo 700 caracteres. Incluye el dolor concreto del local, la URL de la preview, Sanji Express a 290 USD una sola vez (landing, GSAP, menú digital y reserva por WhatsApp) y Sanji Autonomous Core a 1.200 USD de setup (conserje de reservas con IA, CRM, reseñas y POS). Cerrá pidiendo una respuesta por este chat.",
  "pt-br":
    "Você é o SDR da Sanji. Uma única mensagem de WhatsApp em português do Brasil, sem emoji, sem markdown. No máximo 700 caracteres. Inclua a dor operacional, a URL da preview, Sanji Express a 290 USD em pagamento único e Sanji Autonomous Core a 1.200 USD de setup. Peça uma resposta neste chat.",
  "pt-pt":
    "És o SDR da Sanji. Uma única mensagem de WhatsApp em português europeu, sem emoji, sem markdown. No máximo 700 caracteres. Inclui a dor operacional, o URL da preview, Sanji Express a 290 USD num pagamento único e Sanji Autonomous Core a 1.200 USD de arranque. Pede uma resposta nesta conversa.",
  fr: "Tu es le SDR de Sanji. Un seul WhatsApp en français, vouvoiement, sans emoji, sans markdown. 700 caractères maximum. Inclus la douleur opérationnelle, l'URL de preview, Sanji Express à 290 USD en une fois et Sanji Autonomous Core à 1 200 USD de mise en place. Demande une réponse sur ce fil.",
  it: "Sei l'SDR di Sanji. Un solo WhatsApp in italiano, tono diretto, senza emoji, senza markdown. Massimo 700 caratteri. Includi il problema operativo, l'URL della preview, Sanji Express a 290 USD una tantum e Sanji Autonomous Core a 1.200 USD di setup. Chiedi una risposta in questa chat.",
};

function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function grokConfigured(): boolean {
  const key = process.env.XAI_GROK_API_KEY?.trim() ?? "";
  return key.length > 0 && !key.includes("replace_me");
}

export async function craftWhatsAppPitch(lead: RestaurantLead): Promise<Pitch> {
  const voice = voiceFor(lead);
  const fallback = houseTemplate(lead, voice);
  const packed = (message: string, source: Pitch["source"]): Pitch => ({
    message,
    source,
    voice,
    whatsappUrl: whatsappLink(lead.owner_phone, message),
  });

  if (!grokConfigured()) return packed(fallback, "template");

  try {
    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: process.env.XAI_MODEL?.trim() || "grok-3-latest",
        temperature: 0.4,
        max_tokens: 420,
        messages: [
          { role: "system", content: SYSTEM[voice] },
          {
            role: "user",
            content: [
              `Owner: ${lead.owner_name}`,
              `Restaurant: ${lead.name}`,
              `City: ${lead.city}`,
              `Country: ${lead.country}`,
              `Region: ${lead.region}`,
              `Language: ${lead.language}`,
              `Voice: ${voice}`,
              `Price tier: ${lead.price_tier}`,
              `Google: ${lead.google_rating} from ${lead.review_count} reviews`,
              `Hot lead score: ${lead.hot_lead_score}`,
              `Specialty: ${lead.specialty}`,
              `Pain: ${lead.pain_point}`,
              `Preview: ${previewUrl(lead.slug)}`,
              "Write the WhatsApp.",
            ].join("\n"),
          },
        ],
      },
      {
        timeout: 20_000,
        headers: {
          authorization: `Bearer ${process.env.XAI_GROK_API_KEY}`,
          "content-type": "application/json",
        },
      },
    );
    const content = response.data?.choices?.[0]?.message?.content;
    const message = typeof content === "string" ? content.trim() : "";
    if (!message) return packed(fallback, "template");
    return packed(message, "grok");
  } catch (error) {
    const reason = axios.isAxiosError(error) ? error.message : "xAI request failed";
    console.log(`\x1b[91m[GROKBOT]\x1b[0m xAI unavailable (${reason}). Using the ${voice} house copy.`);
    return packed(fallback, "template");
  }
}
