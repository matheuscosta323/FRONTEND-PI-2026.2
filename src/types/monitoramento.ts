/* Contratos da API Flask (backend/app), deduzidos das respostas das rotas /api. */

export type Fruta = "uva" | "manga";
export type StatusLote = "saudavel" | "atencao" | "critico" | "estavel";
export type NivelAlerta = "atencao" | "critico";

export interface Leitura {
  /** Data ISO 8601. */
  data: string;
  temperatura: number;
  /** Umidade do solo (%). */
  umidade: number;
  /** Umidade do ar (%). */
  umidadeAr: number;
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
  campo: "temperatura" | "umidade" | "umidadeAr";
  nome: string;
  cor: string;
}

export interface BackendLote {
  id: number;
  fruta: string;
  status: string;
  temp_ideal_min: number;
  temp_ideal_max: number;
  umidade_ar_ideal_min?: number | null;
  umidade_ar_ideal_max?: number | null;
  umidade_solo_ideal_min?: number | null;
  umidade_solo_ideal_max?: number | null;
  usuario_id: number;
}

export interface BackendSensor {
  id: number;
  nome: string;
  lote_id: number;
}

export interface BackendRegistro {
  id: number;
  temperatura_celsius: number;
  umidade_ar?: number | null;
  umidade_solo?: number | null;
  status: string;
  tempo_registro: string | null;
  sensor_id: number;
}
