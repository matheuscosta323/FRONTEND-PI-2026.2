import type {
  CampoLeitura,
  CanalThingspeak,
  LeituraThingspeak,
  RespostaThingspeak,
} from "@/types/thingspeak";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_THINGSPEAK = "https://api.thingspeak.com";
const TIMEOUT_MS = 12_000;
const RESULTADOS_PADRAO = 100;
const RESULTADOS_MAX = 8_000;
/** Várias telas fazem polling; uma consulta ao ThingSpeak por janela evita o limite de requisições. */
const CACHE_MS = 10_000;

type FeedBruto = Record<string, unknown> & {
  created_at?: unknown;
  entry_id?: unknown;
};

interface RespostaBruta {
  channel?: Record<string, unknown>;
  feeds?: unknown;
}

interface ErroThingspeak {
  error?: unknown;
}

let cache: { resposta: RespostaThingspeak; expiraEm: number } | null = null;

function json(resposta: RespostaThingspeak) {
  return Response.json(resposta, { headers: { "Cache-Control": "no-store" } });
}

function respostaErro(mensagem: string, status: number) {
  return Response.json({ erro: mensagem }, { status });
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function normalizarNome(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * O canal real usa field1=Temperatura, field2=Umidade e field3=Umidade do solo.
 * Os nomes do canal têm prioridade; as variáveis permitem ajustar sem alterar código.
 */
function detectarCampos(canal: Record<string, unknown>): Record<CampoLeitura, string> {
  const campos: Record<CampoLeitura, string> = {
    temperatura: process.env.THINGSPEAK_FIELD_TEMPERATURA ?? "field1",
    umidadeAr: process.env.THINGSPEAK_FIELD_UMIDADE_AR ?? "field2",
    umidadeSolo: process.env.THINGSPEAK_FIELD_UMIDADE_SOLO ?? "field3",
  };

  for (let indice = 1; indice <= 8; indice += 1) {
    const field = `field${indice}`;
    const nome = normalizarNome(canal[field]);
    if (!nome) continue;

    if (nome.includes("solo")) {
      campos.umidadeSolo = field;
    } else if (nome.includes("temp")) {
      campos.temperatura = field;
    } else if (nome.includes("umid")) {
      campos.umidadeAr = field;
    }
  }

  return campos;
}

function lerResultados(): number {
  const bruto = Number(process.env.THINGSPEAK_RESULTS ?? RESULTADOS_PADRAO);
  if (!Number.isFinite(bruto)) return RESULTADOS_PADRAO;
  return Math.min(RESULTADOS_MAX, Math.max(1, Math.round(bruto)));
}

function lerChave(): string | undefined {
  return (
    process.env.THINGSPEAK_READ_KEY?.trim() ??
    process.env.THINGSPEAK_READ_API_KEY?.trim()
  );
}

async function buscarFeed(
  canalId: string,
  chave: string,
  resultados: number,
): Promise<RespostaBruta> {
  const url = new URL(`/channels/${encodeURIComponent(canalId)}/feeds.json`, BASE_THINGSPEAK);
  url.searchParams.set("api_key", chave);
  url.searchParams.set("results", String(resultados));

  const resposta = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const corpo = (await resposta.json().catch(() => null)) as RespostaBruta | ErroThingspeak | null;

  if (!resposta.ok) {
    const detalhe = corpo && "error" in corpo ? texto(corpo.error) : null;
    throw new Error(detalhe ?? `O ThingSpeak respondeu com HTTP ${resposta.status}.`);
  }

  if (!corpo || typeof corpo !== "object") {
    throw new Error("O ThingSpeak retornou uma resposta inválida.");
  }

  if ("error" in corpo) {
    throw new Error(texto(corpo.error) ?? "O ThingSpeak retornou um erro.");
  }

  return corpo as RespostaBruta;
}

function mapearLeituras(
  feeds: FeedBruto[],
  campos: Record<CampoLeitura, string>,
): LeituraThingspeak[] {
  const leituras = feeds.flatMap((feed) => {
    const data = texto(feed.created_at);
    const temperatura = numero(feed[campos.temperatura]);
    const umidadeAr = numero(feed[campos.umidadeAr]);
    const umidadeSolo = numero(feed[campos.umidadeSolo]);

    if (!data || temperatura == null || umidadeAr == null || umidadeSolo == null) return [];

    return [
      {
        entryId: numero(feed.entry_id) ?? 0,
        data,
        temperatura,
        umidadeAr,
        umidadeSolo,
      } satisfies LeituraThingspeak,
    ];
  });

  return leituras.sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
  );
}

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof DOMException && erro.name === "TimeoutError") {
    return "O ThingSpeak demorou para responder. Tente novamente em instantes.";
  }
  if (erro instanceof TypeError) {
    return "Não foi possível conectar ao ThingSpeak. Verifique a conexão do servidor.";
  }
  if (erro instanceof Error) return erro.message;
  return "Falha ao consultar o ThingSpeak.";
}

export async function GET() {
  if (cache && cache.expiraEm > Date.now()) return json(cache.resposta);

  const canalId = process.env.THINGSPEAK_CHANNEL_ID?.trim();
  const chave = lerChave();

  if (!canalId || !chave) {
    return respostaErro(
      "Canal do ThingSpeak não configurado. Defina THINGSPEAK_CHANNEL_ID e THINGSPEAK_READ_KEY no .env.local.",
      500,
    );
  }

  if (!/^\d+$/.test(canalId)) {
    return respostaErro("THINGSPEAK_CHANNEL_ID deve conter apenas números.", 500);
  }

  try {
    const bruto = await buscarFeed(canalId, chave, lerResultados());
    const canalBruto = bruto.channel ?? {};
    const campos = detectarCampos(canalBruto);
    const feeds = Array.isArray(bruto.feeds) ? (bruto.feeds as FeedBruto[]) : [];
    const leituras = mapearLeituras(feeds, campos);

    const canal: CanalThingspeak = {
      id: numero(canalBruto.id) ?? Number(canalId),
      nome: texto(canalBruto.name) ?? `Canal ${canalId}`,
      atualizadoEm: texto(canalBruto.updated_at),
      ultimaEntrada: numero(canalBruto.last_entry_id),
    };

    const resposta: RespostaThingspeak = { canal, leituras, campos };
    cache = { resposta, expiraEm: Date.now() + CACHE_MS };

    return json(resposta);
  } catch (erro) {
    const mensagem = mensagemDeErro(erro);
    const status = mensagem.includes("demorou") ? 504 : 502;
    console.error("[thingspeak] Erro ao buscar o canal:", mensagem);
    return respostaErro(`Não foi possível consultar o ThingSpeak. ${mensagem}`, status);
  }
}
