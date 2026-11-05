import type { Metadata } from "next";
import { LoteView } from "./lote-view";

export const metadata: Metadata = { title: "Lote" };

interface LotePageProps {
  params: Promise<{ codigo: string }>;
}

export default async function LotePage({ params }: LotePageProps) {
  const { codigo } = await params;
  return <LoteView codigo={decodeURIComponent(codigo)} />;
}
