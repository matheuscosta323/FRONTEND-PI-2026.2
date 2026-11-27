"use client";

import { useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";

interface EstadoPolling<T> {
  dados?: T;
  erro?: unknown;
  atualizadoEm?: Date;
}

/** Busca os dados ao montar e a cada intervalo. `buscarDados` precisa ser estável. */
export function usePolling<T>(buscarDados: () => Promise<T>): EstadoPolling<T> {
  const [estado, setEstado] = useState<EstadoPolling<T>>({});

  useEffect(() => {
    let ativo = true;

    async function executar() {
      try {
        const dados = await buscarDados();
        if (ativo) setEstado({ dados, atualizadoEm: new Date() });
      } catch (erro) {
        console.error(erro);
        if (ativo) setEstado((atual) => ({ ...atual, erro }));
      }
    }

    executar();
    const intervalo = setInterval(executar, CONFIG.refreshMs);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [buscarDados]);

  return estado;
}
