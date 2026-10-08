import { CONFIG } from "../config.js";

const BASE = "https://api.thingspeak.com/channels";

// Gera dados fictícios enquanto o channelId estiver vazio, para o layout poder ser testado.
function dadosDemo(n) {
  const agora = Date.now(), passo = (6 * 24 * 3600 * 1000) / n;
  return Array.from({ length: n }, (_, i) => ({
    data: new Date(agora - (n - 1 - i) * passo),
    temperatura: 26 + 3 * Math.sin(i / 6) + i * 0.03,
    umidade: 60 + 8 * Math.sin(i / 9 + 1) + i * 0.2,
  }));
}

export async function buscarLeituras() {
  const { channelId, readApiKey, results, fields } = CONFIG;
  if (!channelId) {
    console.warn("[ThingSpeak] channelId vazio em config.js: usando dados de demonstração.");
    return { leituras: dadosDemo(results), demo: true };
  }
  const params = new URLSearchParams({ results });
  if (readApiKey) params.set("api_key", readApiKey);

  const resp = await fetch(`${BASE}/${channelId}/feeds.json?${params}`);
  if (!resp.ok) throw new Error(`ThingSpeak respondeu ${resp.status}`);
  const json = await resp.json();

  const leituras = json.feeds
    .map((f) => ({
      data: new Date(f.created_at),
      temperatura: parseFloat(f[fields.Temperatura]),
      umidade: parseFloat(f[fields.Umidade]),
    }))
    .filter((l) => !isNaN(l.temperatura) && !isNaN(l.umidade));
  return { leituras, demo: false };
}
