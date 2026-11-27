import type { Metadata } from "next";
import { LotesView } from "./lotes-view";

export const metadata: Metadata = { title: "Lotes" };

export default function LotesPage() {
  return <LotesView />;
}
