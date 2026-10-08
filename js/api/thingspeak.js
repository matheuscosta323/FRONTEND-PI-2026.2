import { CONFIG } from "../config.js";

const BASE = "https://api.thingspeak.com/channels";

export async function buscarLeituras() {
  const { channelId, readApiKey, results, fields } = CONFIG;
  if (!channelId) {
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
