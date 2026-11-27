import { buscar } from "@/lib/api/http";
import { CONFIG } from "@/lib/config";
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

export async function buscarLeituras(): Promise<Leitura[]> {
  const registros = await buscar<BackendRegistro[]>("/registros");
  const ordenados = [...registros].sort((a, b) =>
    (a.tempo_registro ?? "").localeCompare(b.tempo_registro ?? ""),
  );

  return ordenados.slice(-CONFIG.results).map((reg) => ({
    data: reg.tempo_registro ?? new Date().toISOString(),
    temperatura: reg.temperatura_celsius,
    umidade: reg.umidade_solo ?? reg.umidade_ar ?? 0,
    umidadeAr: reg.umidade_ar ?? 0,
  }));
}

export async function buscarResumo(): Promise<DadosResumo> {
  const [lotes, sensores, registros] = await Promise.all([
    buscar<BackendLote[]>("/lotes"),
    buscar<BackendSensor[]>("/sensores"),
    buscar<BackendRegistro[]>("/registros"),
  ]);

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
  const [lotes, sensores, registros] = await Promise.all([
    buscar<BackendLote[]>("/lotes"),
    buscar<BackendSensor[]>("/sensores"),
    buscar<BackendRegistro[]>("/registros"),
  ]);

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
  const idNumerico = Number(codigo.replace(/\D/g, "")) || 1;
  const [lote, sensores, registros] = await Promise.all([
    buscar<BackendLote>(`/lotes/${idNumerico}`),
    buscar<BackendSensor[]>("/sensores"),
    buscar<BackendRegistro[]>("/registros"),
  ]);

  const sensoresLote = sensores.filter((s) => s.lote_id === lote.id);
  const registrosLote = registros
    .filter((r) => sensoresLote.some((s) => s.id === r.sensor_id))
    .sort((a, b) => (a.tempo_registro ?? "").localeCompare(b.tempo_registro ?? ""));

  const leituras: Leitura[] = registrosLote.map((reg) => ({
    data: reg.tempo_registro ?? new Date().toISOString(),
    temperatura: reg.temperatura_celsius,
    umidade: reg.umidade_solo ?? reg.umidade_ar ?? 0,
    umidadeAr: reg.umidade_ar ?? 0,
  }));

  const somaTemp = leituras.reduce((acc, curr) => acc + curr.temperatura, 0);
  const somaUmid = leituras.reduce((acc, curr) => acc + curr.umidade, 0);

  const mediaTemperatura = leituras.length > 0 ? somaTemp / leituras.length : null;
  const mediaUmidade = leituras.length > 0 ? somaUmid / leituras.length : null;

  const maisRecente = registrosLote[registrosLote.length - 1];

  const loteResumo: LoteResumo = {
    codigo: `LOTE-${String(lote.id).padStart(2, "0")}`,
    nome: lote.fruta ? lote.fruta.charAt(0).toUpperCase() + lote.fruta.slice(1) : `Lote ${lote.id}`,
    fruta: normalizarFruta(lote.fruta),
    status: normalizarStatus(lote.status),
    minutosAtras: calcularMinutosAtras(maisRecente?.tempo_registro),
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
    leituras,
    mediaTemperatura,
    mediaUmidade,
    alertas,
  };
}
