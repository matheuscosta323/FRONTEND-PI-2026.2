"use client";

import { createContext, useContext, type ReactNode } from "react";
import { buscarAlertas } from "@/lib/api/nodered";
import { usePolling } from "@/hooks/use-polling";
import type { Alerta } from "@/types/monitoramento";

const AlertasContext = createContext<Alerta[] | undefined>(undefined);

/** Uma única consulta a /alertas alimenta o menu e as telas abertas. */
export function AlertasProvider({ children }: { children: ReactNode }) {
  const { dados } = usePolling(buscarAlertas);
  return <AlertasContext.Provider value={dados}>{children}</AlertasContext.Provider>;
}

/** `undefined` enquanto a primeira resposta não chega. */
export function useAlertas() {
  return useContext(AlertasContext);
}
