/** Contratos da rota interna `/api/thingspeak` (leitura do canal no servidor). */

export type CampoLeitura = "temperatura" | "umidadeAr" | "umidadeSolo";

export interface LeituraThingspeak {
  entryId: number;
  /** Data ISO 8601 devolvida pelo ThingSpeak. */
  data: string;
  temperatura: number;
  umidadeAr: number;
  umidadeSolo: number;
}

export interface CanalThingspeak {
  id: number;
  nome: string;
  atualizadoEm: string | null;
  ultimaEntrada: number | null;
}

export interface RespostaThingspeak {
  canal: CanalThingspeak;
  leituras: LeituraThingspeak[];
  campos: Record<CampoLeitura, string>;
}
