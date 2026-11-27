import type { Metadata } from "next";
import { RelatorioView } from "./relatorio-view";

export const metadata: Metadata = { title: "Relatório de Condições" };

export default function RelatorioPage() {
  return <RelatorioView />;
}
