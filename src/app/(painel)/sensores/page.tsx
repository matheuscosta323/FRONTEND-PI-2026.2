import type { Metadata } from "next";
import { RelatorioView } from "../relatorio/relatorio-view";

export const metadata: Metadata = { title: "Sensores — Relatório de Condições" };

export default function SensoresPage() {
  return <RelatorioView />;
}
