import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Tela não encontrada" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Tela não encontrada</h1>
      <p className="text-texto-suave">Esta tela não existe ou ainda não está disponível.</p>
      <Link className="btn-outline" href="/">
        Voltar à visão geral
      </Link>
    </main>
  );
}
