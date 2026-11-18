import { getLeadBySlug } from "@sanji/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentBar } from "@/components/AgentBar";
import { RestaurantLandingGSAP } from "@/components/RestaurantLandingGSAP";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lead = await getLeadBySlug(slug);
  if (!lead) return { title: "Preview no encontrada · Sanji" };
  return {
    title: `${lead.name} · ${lead.neighborhood}`,
    description: `${lead.specialty}. Landing generada por Sanji para ${lead.neighborhood}.`,
  };
}

export default async function PreviewPage({ params }: Props) {
  const { slug } = await params;
  const lead = await getLeadBySlug(slug);
  if (!lead) notFound();

  const gatewayUrl = process.env.X402_GATEWAY_URL?.trim() || "http://localhost:4000";

  return (
    <>
      <AgentBar slug={lead.slug} name={lead.name} gatewayUrl={gatewayUrl} />
      <RestaurantLandingGSAP lead={lead} />
    </>
  );
}
