import { buscar } from "@/lib/api/http";
import { CONFIG } from "@/lib/config";
import type {
  Alerta,
  DadosResumo,
  DetalheLote,
  Leitura,
  ListaLotes,
} from "@/types/monitoramento";

export const buscarLeituras = () => buscar<Leitura[]>("/leituras", { results: CONFIG.results });
export const buscarResumo = () => buscar<DadosResumo>("/resumo");
export const buscarAlertas = () => buscar<Alerta[]>("/alertas");
export const buscarLotes = (pagina: number) => buscar<ListaLotes>("/lotes", { pagina });
export const buscarLote = (codigo: string, dias = 7) =>
  buscar<DetalheLote>("/lotes/" + encodeURIComponent(codigo), { dias });
