"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { encerrarSessao } from "@/lib/auth/sessao";
import { useSessao } from "@/hooks/use-sessao";

/** Controle de navegação apenas: quem protege os dados é a API. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, sessao } = useSessao();
  const router = useRouter();
  const pathname = usePathname();
  const expiraEm = sessao?.expiraEm;

  useEffect(() => {
    if (status === "anonimo") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  useEffect(() => {
    if (expiraEm === undefined) return;
    const temporizador = setTimeout(encerrarSessao, expiraEm - Date.now());
    return () => clearTimeout(temporizador);
  }, [expiraEm]);

  if (status !== "autenticado") return null;
  return children;
}
