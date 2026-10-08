import { CONFIG } from "../config.js";

async function get(caminho, params = {}) {
  const qs = new URLSearchParams(params);
  const resp = await fetch(`${CONFIG.apiBase}${caminho}?${qs}`);
  if (!resp.ok) throw new Error(`Node-RED respondeu ${resp.status} em ${caminho}`);
  return resp.json();
}

export async function buscarLeituras() {
  const dados = await get("/leituras", { results: CONFIG.results });
  return { leituras: dados.map((l) => ({ ...l, data: new Date(l.data) })) };
}

export const buscarResumo = () => get("/resumo");
export const buscarAlertas = () => get("/alertas");

export const buscarLotes = (pagina = 1) => get("/lotes", { pagina });

export async function buscarLote(codigo, dias = 7) {
  const dados = await get(`/lotes/${codigo}`, { dias });
  dados.leituras = dados.leituras.map((l) => ({ ...l, data: new Date(l.data) }));
  return dados;
}
