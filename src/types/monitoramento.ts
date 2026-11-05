/* Contratos do Node-RED, deduzidos do uso feito pelas telas (não há fluxos versionados no repositório). */

export type Fruta = "uva" | "manga";
export type StatusLote = "saudavel" | "atencao" | "critico" | "estavel";
export type NivelAlerta = "atencao" | "critico";

export interface Leitura {
  /** Data ISO 8601. */
  data: string;
  temperatura: number;
  umidade: number;
}

export interface LoteResumo {
  codigo: string;
  nome: string;
  fruta: Fruta;
  status: StatusLote;
  minutosAtras: number | null;
}

/** Item de `GET /alertas`. */
export interface Alerta {
  titulo: string;
  local: string;
  minutosAtras: number | null;
}

/** Item de `alertas` em `GET /lotes/:codigo`. */
export interface AlertaLote {
  titulo: string;
  detalhe: string;
  nivel: NivelAlerta;
  minutosAtras: number | null;
}

/** `GET /resumo` */
export interface DadosResumo {
  resumo: {
    lotes: number;
    uva: number;
    manga: number;
    sensoresAtivos: number;
    sensoresTotal: number;
  };
  lotes: LoteResumo[];
}

/** `GET /lotes?pagina=` */
export interface ListaLotes {
  pagina: number;
  paginas: number;
  lotes: LoteResumo[];
}

/** `GET /lotes/:codigo?dias=` */
export interface DetalheLote {
  lote: LoteResumo;
  leituras: Leitura[];
  /** `null` quando o lote não tem sensor. */
  mediaTemperatura: number | null;
  mediaUmidade: number | null;
  alertas: AlertaLote[];
}

/** Série desenhada no gráfico. */
export interface LinhaGrafico {
  campo: "temperatura" | "umidade";
  nome: string;
  cor: string;
}
