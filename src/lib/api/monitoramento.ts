import { ApiError, buscar } from "@/lib/api/http";
import { CONFIG } from "@/lib/config";
import type { LeituraThingspeak, RespostaThingspeak } from "@/types/thingspeak";
import type {
  Alerta,
  AlertaLote,
  BackendLote,
  BackendRegistro,
  BackendSensor,
  DadosResumo,
  DetalheLote,
  Fruta,
  Leitura,
  ListaLotes,
  LoteResumo,
  StatusLote,
} from "@/types/monitoramento";

function normalizarFruta(fruta?: string): Fruta {
  const f = fruta?.toLowerCase() ?? "";
  return f.includes("manga") ? "manga" : "uva";
}

function normalizarStatus(status?: string): StatusLote {
  const s = status?.toLowerCase() ?? "";
  if (s === "critico" || s === "crítico") return "critico";
  if (s === "atencao" || s === "atenção") return "atencao";
  if (s === "estavel" || s === "estável") return "estavel";
  return "saudavel";
}

function calcularMinutosAtras(dataIso?: string | null): number | null {
  if (!dataIso) return null;
  const ms = new Date(dataIso).getTime();
  if (isNaN(ms)) return null;
  const diffMin = Math.round((Date.now() - ms) / 60000);
  return Math.max(0, diffMin);
}

function mapearLeiturasThingspeak(leituras: LeituraThingspeak[]): Leitura[] {
  // `umidade` é a umidade do solo no contrato usado pelas telas.
  return leituras.map((leitura) => ({
    data: leitura.data,
    temperatura: leitura.temperatura,
    umidade: leitura.umidadeSolo,
    umidadeAr: leitura.umidadeAr,
  }));
}

async function buscarLeiturasThingspeak(): Promise<Leitura[]> {
  const { leituras } = await buscarRespostaThingspeak();
  return mapearLeiturasThingspeak(leituras);
}

/**
 * Busca as leituras na rota interna `/api/thingspeak`. A chamada ao ThingSpeak
 * acontece no servidor Next.js, então a Read API Key não vai para o navegador.
 */
async function buscarRespostaThingspeak(): Promise<RespostaThingspeak> {
  let resposta: Response;
  try {
    resposta = await fetch("/api/thingspeak", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Não foi possível consultar o ThingSpeak.", 0);
  }

  const corpo = (await resposta.json().catch(() => null)) as
    | RespostaThingspeak
    | { erro?: string }
    | null;

  if (!resposta.ok) {
    const mensagem = corpo && "erro" in corpo ? corpo.erro : null;
    throw new ApiError(mensagem ?? "Não foi possível consultar o ThingSpeak.", resposta.status);
  }

  if (!corpo || !("leituras" in corpo)) {
    throw new ApiError("O ThingSpeak retornou uma resposta inválida.", resposta.status);
  }

  return corpo;
}

export async function buscarLeituras(): Promise<Leitura[]> {
  const leituras = await buscarLeiturasThingspeak();
  return leituras.slice(-CONFIG.results);
}

/**
 * Adapta as leituras do canal ao formato de registro esperado por relatório e
 * alertas. Como existe um único canal, elas são associadas ao primeiro sensor
 * cadastrado no backend (que permanece responsável por lotes e sensores).
 */
export async function buscarRegistrosThingspeak(
  sensores?: BackendSensor[],
): Promise<BackendRegistro[]> {
  const lista = sensores ?? (await buscar<BackendSensor[]>("/sensores"));
  const sensorId = [...lista].sort((a, b) => a.id - b.id)[0]?.id ?? 1;
  const { leituras } = await buscarRespostaThingspeak();

  return leituras.map((leitura) => ({
    id: leitura.entryId,
    temperatura_celsius: leitura.temperatura,
    umidade_ar: leitura.umidadeAr,
    umidade_solo: leitura.umidadeSolo,
    status: "ok",
    tempo_registro: leitura.data,
    sensor_id: sensorId,
  }));
}

/** A central de avisos e o resumo consideram somente a leitura mais recente. */
export async function buscarUltimoRegistroThingspeak(
  sensores?: BackendSensor[],
): Promise<BackendRegistro[]> {
  const registros = await buscarRegistrosThingspeak(sensores);
  return registros.slice(-1);
}

export async function buscarResumo(): Promise<DadosResumo> {
  const [lotes, sensores] = await Promise.all([
    buscar<BackendLote[]>("/lotes"),
    buscar<BackendSensor[]>("/sensores"),
  ]);
  const registros = await buscarUltimoRegistroThingspeak(sensores);

  const lotesResumo: LoteResumo[] = lotes.map((lote) => {
    const sensoresLote = sensores.filter((s) => s.lote_id === lote.id);
    const registrosLote = registros
      .filter((r) => sensoresLote.some((s) => s.id === r.sensor_id))
      .sort((a, b) => (b.tempo_registro ?? "").localeCompare(a.tempo_registro ?? ""));

    const maisRecente = registrosLote[0];

    return {
      codigo: `LOTE-${String(lote.id).padStart(2, "0")}`,
      nome: lote.fruta ? lote.fruta.charAt(0).toUpperCase() + lote.fruta.slice(1) : `Lote ${lote.id}`,
      fruta: normalizarFruta(lote.fruta),
      status: normalizarStatus(lote.status),
      minutosAtras: calcularMinutosAtras(maisRecente?.tempo_registro),
    };
  });

  const sensoresComRegistro = new Set(registros.map((r) => r.sensor_id)).size;

  return {
    resumo: {
      lotes: lotes.length,
      uva: lotes.filter((l) => normalizarFruta(l.fruta) === "uva").length,
      manga: lotes.filter((l) => normalizarFruta(l.fruta) === "manga").length,
      sensoresAtivos: sensoresComRegistro > 0 ? sensoresComRegistro : sensores.length,
      sensoresTotal: sensores.length,
    },
    lotes: lotesResumo,
  };
}

export async function buscarAlertas(): Promise<Alerta[]> {
  const [lotes, sensores] = await Promise.all([
    buscar<BackendLote[]>("/lotes"),
    buscar<BackendSensor[]>("/sensores"),
  ]);
  const registros = await buscarUltimoRegistroThingspeak(sensores);

  const alertas: Alerta[] = [];

  for (const lote of lotes) {
    const status = normalizarStatus(lote.status);
    const codigo = `LOTE-${String(lote.id).padStart(2, "0")}`;

    if (status === "critico" || status === "atencao") {
      alertas.push({
        titulo: `Condição do solo requer atenção no Lote ${lote.id}`,
        local: codigo,
        minutosAtras: 10,
      });
    }
  }

  for (const reg of registros) {
    if (reg.status === "alerta") {
      const sensor = sensores.find((s) => s.id === reg.sensor_id);
      const lote = sensor ? lotes.find((l) => l.id === sensor.lote_id) : undefined;
      const local = lote ? `LOTE-${String(lote.id).padStart(2, "0")}` : `Sensor ${reg.sensor_id}`;

      alertas.push({
        titulo: `Temperatura do solo fora da faixa ideal (${reg.temperatura_celsius} °C)`,
        local,
        minutosAtras: calcularMinutosAtras(reg.tempo_registro),
      });
    }
  }

  return alertas;
}

export async function buscarLotes(pagina: number): Promise<ListaLotes> {
  const dados = await buscarResumo();
  const ITENS_POR_PAGINA = 8;
  const total = dados.lotes.length;
  const paginas = Math.max(1, Math.ceil(total / ITENS_POR_PAGINA));
  const paginaValida = Math.min(Math.max(1, pagina), paginas);
  const inicio = (paginaValida - 1) * ITENS_POR_PAGINA;

  return {
    pagina: paginaValida,
    paginas,
    lotes: dados.lotes.slice(inicio, inicio + ITENS_POR_PAGINA),
  };
}

export async function buscarLote(codigo: string, dias = 7): Promise<DetalheLote> {
  const idNumerico = Number(codigo.replace(/\D/g, ""));
  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw new ApiError("Lote não encontrado.", 404);
  }

  const [lote, leituras] = await Promise.all([
    buscar<BackendLote>(`/lotes/${idNumerico}`),
    buscarLeiturasThingspeak(),
  ]);

  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  const leiturasPeriodo = leituras.filter(
    (leitura) => new Date(leitura.data).getTime() >= limite,
  );

  const somaTemp = leiturasPeriodo.reduce((acc, curr) => acc + curr.temperatura, 0);
  const somaUmid = leiturasPeriodo.reduce((acc, curr) => acc + curr.umidade, 0);

  const mediaTemperatura = leiturasPeriodo.length > 0 ? somaTemp / leiturasPeriodo.length : null;
  const mediaUmidade = leiturasPeriodo.length > 0 ? somaUmid / leiturasPeriodo.length : null;

  const maisRecente = leiturasPeriodo[leiturasPeriodo.length - 1];

  const loteResumo: LoteResumo = {
    codigo: `LOTE-${String(lote.id).padStart(2, "0")}`,
    nome: lote.fruta ? lote.fruta.charAt(0).toUpperCase() + lote.fruta.slice(1) : `Lote ${lote.id}`,
    fruta: normalizarFruta(lote.fruta),
    status: normalizarStatus(lote.status),
    minutosAtras: calcularMinutosAtras(maisRecente?.data),
  };

  const alertas: AlertaLote[] = [];
  if (loteResumo.status === "critico" || loteResumo.status === "atencao") {
    alertas.push({
      titulo: "Oscilação térmica no solo",
      detalhe: "Temperatura do solo próxima dos limites recomendados.",
      nivel: loteResumo.status === "critico" ? "critico" : "atencao",
      minutosAtras: loteResumo.minutosAtras,
    });
  }

  return {
    lote: loteResumo,
    leituras: leiturasPeriodo,
    mediaTemperatura,
    mediaUmidade,
    alertas,
  };
}
