import { CONFIG } from "../config.js";
    
export async function buscar(caminho, params = {}) {
  const url = CONFIG.apiBase + caminho + "?" + new URLSearchParams(params);
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error("Node-RED respondeu " + resposta.status + " em " + caminho);
  }
  return resposta.json();
}
