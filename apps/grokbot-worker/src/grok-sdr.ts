import type { RestaurantLead } from "@sanji/database";
import axios from "axios";

export interface Pitch {
  message: string;
  source: "grok" | "template";
  whatsappUrl: string;
}

const SYSTEM_PROMPT = [
  "Sos el SDR de Sanji, una agencia de gastronomía en la Ciudad de Buenos Aires.",
  "Escribís un solo mensaje de WhatsApp en español rioplatense, con voseo.",
  "Sin emojis, sin markdown, sin asunto, sin comillas, sin lista de viñetas.",
  "Máximo 700 caracteres. Tono directo, de alguien que ya miró el local. Cero halago vacío.",
  "El mensaje incluye el dolor concreto del local, la URL de la preview, y las dos ofertas:",
  "Sanji Express, USD 290 una sola vez: landing a medida, animaciones GSAP, menú digital y reserva por WhatsApp.",
  "Sanji Autonomous Core, USD 1200 de setup: conserje de reservas con IA, CRM, motor de reseñas e integración con el POS.",
  "Cerrá pidiendo una respuesta por este mismo chat.",
].join(" ");

function previewUrl(slug: string): string {
  const base = process.env.PREVIEW_ENGINE_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/preview/${slug}`;
}

function firstName(owner: string): string {
  const name = owner.trim().split(/\s+/)[0];
  return name || owner;
}

export function houseTemplate(lead: RestaurantLead): string {
  const url = previewUrl(lead.slug);
  const pain = lead.pain_point.trim().replace(/\.$/, "");
  const painSentence = pain.charAt(0).toLowerCase() + pain.slice(1);
  return [
    `${firstName(lead.owner_name)}, mirá: ${painSentence}.`,
    `Te dejé la página de ${lead.name} con la carta y el botón de reserva: ${url}`,
    "Sanji Express, USD 290 una sola vez: landing, animaciones, menú digital y reserva directa por WhatsApp.",
    "Sanji Autonomous Core, USD 1200 de setup: conserje de reservas, CRM, reseñas y POS.",
    "Si te cierra, respondé este mensaje y lo dejamos andando esta semana.",
  ].join("\n");
}

function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function grokConfigured(): boolean {
  const key = process.env.XAI_GROK_API_KEY?.trim() ?? "";
  return key.length > 0 && !key.includes("replace_me");
}

export async function craftWhatsAppPitch(lead: RestaurantLead): Promise<Pitch> {
  const fallback = houseTemplate(lead);
  if (!grokConfigured()) {
    return { message: fallback, source: "template", whatsappUrl: whatsappLink(lead.owner_phone, fallback) };
  }

  try {
    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: process.env.XAI_MODEL?.trim() || "grok-3-latest",
        temperature: 0.4,
        max_tokens: 420,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              `Dueño: ${lead.owner_name}`,
              `Local: ${lead.name}`,
              `Barrio: ${lead.neighborhood}`,
              `Especialidad: ${lead.specialty}`,
              `Dolor: ${lead.pain_point}`,
              `Preview: ${previewUrl(lead.slug)}`,
              "Escribí el WhatsApp.",
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
    if (!message) {
      return { message: fallback, source: "template", whatsappUrl: whatsappLink(lead.owner_phone, fallback) };
    }
    return { message, source: "grok", whatsappUrl: whatsappLink(lead.owner_phone, message) };
  } catch (error) {
    const reason = axios.isAxiosError(error) ? error.message : "xAI request failed";
    console.log(`\x1b[91m[GROKBOT]\x1b[0m xAI no respondió (${reason}). Uso el texto de la casa.`);
    return { message: fallback, source: "template", whatsappUrl: whatsappLink(lead.owner_phone, fallback) };
  }
}
