"use client";

import { hhmm, primeiroNome, saudacao } from "@/lib/format";
import { useSessao } from "@/hooks/use-sessao";

interface TopbarProps {
  atualizadoEm?: Date;
  /** Substitui o horário de atualização em telas sem dados monitorados. */
  subtitulo?: string;
}

export function Topbar({ atualizadoEm, subtitulo }: TopbarProps) {
  const { sessao } = useSessao();
  return (
    <header className="topbar">
      <h1>
        {saudacao()}
        {sessao ? `, ${primeiroNome(sessao.nome)}` : ""}
      </h1>
      <p>{subtitulo ?? `Atualizada às ${atualizadoEm ? hhmm(atualizadoEm) : "--:--"}`}</p>
    </header>
  );
}
