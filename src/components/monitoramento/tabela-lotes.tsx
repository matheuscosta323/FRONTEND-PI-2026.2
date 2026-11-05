import Link from "next/link";
import { ChevronRight, Grape, Leaf, type LucideIcon } from "lucide-react";
import { haMin } from "@/lib/format";
import type { Alerta, Fruta, LoteResumo, StatusLote } from "@/types/monitoramento";

const ROTULO_STATUS: Record<StatusLote, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  critico: "Crítico",
  estavel: "Estável",
};

const FRUTAS: Record<Fruta, { nome: string; icone: LucideIcon }> = {
  uva: { nome: "Uva", icone: Grape },
  manga: { nome: "Manga", icone: Leaf },
};

interface TabelaLotesProps {
  lotes: LoteResumo[];
  comSeta?: boolean;
  alertas?: Alerta[];
}

export function LinhasLotes({ lotes, comSeta = false, alertas = [] }: TabelaLotesProps) {
  return lotes.map((lote) => {
    const href = "/lotes/" + encodeURIComponent(lote.codigo);
    const qtd = alertas.filter((alerta) => alerta.local.includes(lote.codigo)).length;
    const { nome: nomeFruta, icone: IconeFruta } = FRUTAS[lote.fruta];

    return (
      <tr key={lote.codigo}>
        <td>
          <Link href={href}>
            <strong>
              {lote.nome}
              {qtd > 0 && <span className="badge-lote">{qtd}</span>}
            </strong>
            <small>{lote.codigo}</small>
          </Link>
        </td>
        <td>
          <span className="fruta">
            <span className={`fruta-icon fruta-${lote.fruta}`}>
              <IconeFruta aria-hidden="true" />
            </span>
            {nomeFruta}
          </span>
        </td>
        <td>
          <span className={`status status-${lote.status}`}>{ROTULO_STATUS[lote.status]}</span>
        </td>
        <td>{haMin(lote.minutosAtras)}</td>
        {comSeta && (
          <td className="seta">
            <Link href={href} aria-label={`Abrir ${lote.nome}`}>
              <ChevronRight aria-hidden="true" />
            </Link>
          </td>
        )}
      </tr>
    );
  });
}
