"use client";

import { useSyncExternalStore } from "react";
import { assinarSessao, obterSessao } from "@/lib/auth/sessao";
import type { Sessao } from "@/types/auth";

export type EstadoSessao =
  | { status: "carregando"; sessao: null }
  | { status: "anonimo"; sessao: null }
  | { status: "autenticado"; sessao: Sessao };

/** No servidor e na hidratação o storage não existe: o estado começa em "carregando". */
export function useSessao(): EstadoSessao {
  const sessao = useSyncExternalStore(assinarSessao, obterSessao, () => undefined);
  if (sessao === undefined) return { status: "carregando", sessao: null };
  if (sessao === null) return { status: "anonimo", sessao: null };
  return { status: "autenticado", sessao };
}
