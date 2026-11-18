"use client";

import type { ActivityEvent, CommandSnapshot, LeadStatus, RestaurantLead } from "@sanji/database";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STATUS_LABEL: Record<LeadStatus, string> = {
  PENDING_OUTREACH: "Pending",
  CONTACTED: "Contacted",
  PAID_EXPRESS: "Express paid",
  PAID_CORE: "Core paid",
  DEPLOYED: "Deployed",
};

function statusClass(status: LeadStatus): string {
  if (status === "PAID_EXPRESS" || status === "PAID_CORE" || status === "DEPLOYED") {
    return "bg-ember text-obsidian";
  }
  if (status === "CONTACTED") return "border border-ember text-ember";
  return "border border-white/20 text-ash";
}

function clock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function kindLabel(kind: ActivityEvent["kind"]): string {
  if (kind === "x402") return "x402";
  if (kind === "buyback") return "SANJI";
  if (kind === "bounty") return "bounty";
  if (kind === "preview") return "preview";
  return "sdr";
}

export function CommandCenter({ initial }: { initial: CommandSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const response = await fetch("/api/command", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as CommandSnapshot;
        if (!cancelled) setSnapshot(next);
      } catch {
        // Keep the last good snapshot on screen.
      }
    }
    const timer = setInterval(pull, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const node = logRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [snapshot.activity.length]);

  const pending = snapshot.leads.filter((lead) => lead.status === "PENDING_OUTREACH").length;

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)] lg:py-10">
      <section>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember">NA · EU · LATAM</p>
        <h1 className="mt-3 font-display text-5xl leading-[0.92] tracking-[-0.03em] md:text-6xl">
          Sanji Protocol
          <span className="mt-2 block text-3xl italic text-cream/80 md:text-4xl">Live Command Center</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm text-ash">
          {pending} leads still waiting. Source: {snapshot.source === "supabase" ? "Supabase" : "demo store"}.
          The log refreshes every two seconds.
        </p>
        <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {snapshot.leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </ul>
      </section>
      <section className="flex min-h-[420px] flex-col border border-white/10 bg-soot lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">Terminal</p>
          <p className="font-mono text-[11px] text-ash">sanji@global</p>
        </header>
        <ol ref={logRef} className="flex-1 space-y-3 overflow-auto px-4 py-4 font-mono text-xs leading-relaxed">
          {snapshot.activity.length === 0 ? (
            <li className="text-ash">
              No x402 or $SANJI buyback events yet. Run the worker, then activate Express from a preview.
            </li>
          ) : (
            snapshot.activity.map((event) => (
              <li key={event.id}>
                <span className="text-ash">{clock(event.at)}</span>{" "}
                <span className="text-ember">{kindLabel(event.kind)}</span>{" "}
                <span className="text-cream">{event.message}</span>
              </li>
            ))
          )}
        </ol>
      </section>
    </main>
  );
}

function LeadRow({ lead }: { lead: RestaurantLead }) {
  return (
    <li className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl">{lead.name}</h2>
          <span className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${statusClass(lead.status)}`}>
            {STATUS_LABEL[lead.status]}
          </span>
        </div>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
          {lead.city}, {lead.country} · {lead.region} · {lead.price_tier} · {lead.google_rating.toFixed(1)} · {lead.review_count} reviews · {lead.hot_lead_score}
        </p>
        <p className="mt-2 max-w-xl text-sm text-cream/80">{lead.pain_point}</p>
      </div>
      <Link
        href={`/preview/${lead.slug}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-cream hover:border-ember hover:text-ember"
      >
        /preview/{lead.slug}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </li>
  );
}
