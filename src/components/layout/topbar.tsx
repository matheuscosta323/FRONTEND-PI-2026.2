"use client";

import { hhmm, primeiroNome, saudacao } from "@/lib/format";
import { useSessao } from "@/hooks/use-sessao";

interface TopbarProps {
  titulo?: string;
  atualizadoEm?: Date;
  /** Substitui o horário de atualização em telas sem dados monitorados. */
  subtitulo?: string;
}

export function Topbar({ titulo, atualizadoEm, subtitulo }: TopbarProps) {
  const { sessao } = useSessao();
  return (
    <header className="topbar flex items-center justify-between">
      <div>
        <h1>
          {titulo ?? (
            <>
              {saudacao()}
              {sessao ? `, ${primeiroNome(sessao.nome)}` : ""}
            </>
          )}
        </h1>
        <p>{subtitulo ?? `Atualizada às ${atualizadoEm ? hhmm(atualizadoEm) : "--:--"}`}</p>
      </div>
      <div className="flex items-center gap-[8px] text-[11px] text-[#68766f]">
        <span className="w-[7px] h-[7px] rounded-full bg-[#317657]" aria-hidden="true" />
        <span>Dados sincronizados</span>
      </div>
    </header>
  );
}
