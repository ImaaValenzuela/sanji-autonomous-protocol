"use client";

import type { RestaurantLead } from "@sanji/database";
import gsap from "gsap";
import { MessageCircle, Star } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

const COPY: Record<string, { line: string; service: string }> = {
  "brasa-hollywood": {
    line: "Fuego lento sobre Honduras. El corte entra cuando la brasa dice, no cuando el reloj apura.",
    service: "Cena de miércoles a domingo",
  },
  "crudo-chacarita": {
    line: "Pescado del día y vinos que todavía tienen pulso. La carta de ayer no sirve para la de hoy.",
    service: "Cena de martes a sábado",
  },
  "vermu-colegiales": {
    line: "Un vermú largo, una pasta corta y la barra de Colegiales a la hora en que el barrio vuelve a casa.",
    service: "Mediodía y tarde, jueves a domingo",
  },
  "oliva-belgrano": {
    line: "Mercado de la mañana, aceite de verdad y una mesa que se reserva, no que se espera en la vereda.",
    service: "Almuerzo y cena, martes a sábado",
  },
  "taller-crespo": {
    line: "Cinco pasos en la barra. Lo que no entra en el plato se explica acá, no de memoria en el salón.",
    service: "Un turno de noche, jueves a domingo",
  },
};

function copyFor(lead: RestaurantLead): { line: string; service: string } {
  return (
    COPY[lead.slug] ?? {
      line: `${lead.specialty.charAt(0).toUpperCase()}${lead.specialty.slice(1)}.`,
      service: lead.neighborhood,
    }
  );
}

function reservationHref(lead: RestaurantLead): string {
  const digits = lead.owner_phone.replace(/\D/g, "");
  const text = `Hola, quiero reservar una mesa en ${lead.name}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function RestaurantLandingGSAP({ lead }: { lead: RestaurantLead }) {
  const root = useRef<HTMLElement>(null);
  const copy = copyFor(lead);
  const [open, setOpen] = useState<string | null>(lead.menu_highlights[0]?.name ?? null);

  useLayoutEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .fromTo(
          "[data-reveal='stamp']",
          { y: -16, rotation: -18, opacity: 0 },
          { y: 0, rotation: -8, opacity: 1, duration: 0.55 },
        )
        .fromTo(
          "[data-reveal='title']",
          { y: 42, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85 },
          "-=0.25",
        )
        .fromTo(
          "[data-reveal='rating']",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4 },
          "-=0.45",
        )
        .fromTo(
          "[data-reveal='manifesto']",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          "-=0.25",
        )
        .fromTo(
          "[data-reveal='card']",
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
          "-=0.2",
        )
        .fromTo(
          "[data-reveal='cta']",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45 },
          "-=0.15",
        );
    }, scope);

    return () => context.revert();
  }, [lead.slug]);

  return (
    <article ref={root} className="bg-obsidian text-cream">
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-end lg:py-20">
        <div>
          <p data-reveal="stamp" className="stamp font-mono text-[11px]">
            {lead.neighborhood}
          </p>
          <h1
            data-reveal="title"
            className="mt-8 max-w-3xl font-display text-[clamp(3.5rem,8vw,6.5rem)] font-medium leading-[0.88] tracking-[-0.03em]"
          >
            {lead.name}
          </h1>
          <p
            data-reveal="rating"
            className="mt-6 inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em]"
          >
            <Star className="h-3.5 w-3.5 fill-ember text-ember" aria-hidden />
            {lead.google_rating.toFixed(1)} Google
          </p>
          <p data-reveal="manifesto" className="mt-8 max-w-xl font-display text-2xl italic leading-snug text-cream/90">
            {copy.line}
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-ash">{copy.service}</p>
        </div>
        <figure className="relative min-h-[320px] overflow-hidden bg-soot lg:min-h-[520px]">
          <img
            src={lead.hero_image_url}
            alt={`Plato de ${lead.name}`}
            className="h-full w-full object-cover"
          />
          <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian to-transparent p-4 font-mono text-[11px] uppercase tracking-[0.16em]">
            {lead.specialty}
          </figcaption>
        </figure>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 md:px-6" aria-labelledby="carta-title">
        <div className="flex items-end justify-between gap-4 border-b border-white/15 pb-4">
          <h2 id="carta-title" className="font-mono text-xs uppercase tracking-[0.22em] text-ember">
            Carta
          </h2>
          <p className="font-mono text-xs text-ash">{lead.ig_handle}</p>
        </div>
        <div className="divide-y divide-white/10">
          {lead.menu_highlights.map((item) => {
            const expanded = open === item.name;
            return (
              <button
                key={item.name}
                type="button"
                data-reveal="card"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : item.name)}
                className="flex w-full flex-col gap-2 py-6 text-left"
              >
                <span className="flex items-baseline justify-between gap-6">
                  <span className="font-display text-3xl">{item.name}</span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-ember">{item.price_ars}</span>
                </span>
                {expanded ? <span className="max-w-2xl text-sm leading-relaxed text-ash">{item.description}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <div data-reveal="cta" className="flex flex-col justify-between gap-6 border border-ember/50 bg-soot p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">Reserva directa</p>
            <p className="mt-2 font-display text-3xl">Una mesa, sin DM de por medio.</p>
          </div>
          <a
            href={reservationHref(lead)}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-cream px-5 py-3 text-sm font-medium text-obsidian"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Reservar por WhatsApp
          </a>
        </div>
      </section>
    </article>
  );
}
