import type { Metadata } from "next";
import { AlertasView } from "./alertas-view";

export const metadata: Metadata = { title: "Avisos e Alertas" };

export default function AlertasPage() {
  return <AlertasView />;
}
