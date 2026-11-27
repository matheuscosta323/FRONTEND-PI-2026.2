import { obterSessao } from "@/lib/auth/sessao";
import { CONFIG } from "@/lib/config";
import type { ApiResposta, JwtFalha } from "@/types/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** O token foi recusado pelo Flask-JWT-Extended: é preciso entrar novamente. */
    readonly sessaoInvalida = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const ERRO_CONEXAO = "Não foi possível conectar ao servidor. Tente novamente.";
const ERRO_SESSAO = "Sua sessão expirou. Entre novamente.";
const BASE_URL = CONFIG.apiUrl.replace(/\/+$/, "");

/**
 * Anexa o JWT da sessão automaticamente. Assim as rotas protegidas do Flask
 * continuam funcionando mesmo quando o token não é passado explicitamente.
 */
function montarCabecalhos(token?: string): Record<string, string> {
  const bearer = token ?? obterSessao()?.token;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
  };
}

async function lerResposta<T>(resposta: Response): Promise<T> {
  const json = (await resposta.json().catch(() => null)) as
    | ApiResposta<T>
    | JwtFalha
    | null;

  if (json && "msg" in json) throw new ApiError(ERRO_SESSAO, resposta.status, true);
  if (json && "success" in json) {
    if (json.success) return json.data;
    throw new ApiError(json.message ?? "Erro na requisição.", resposta.status);
  }
  if (resposta.ok && json) {
    return json as unknown as T;
  }
  throw new ApiError("Erro interno no servidor.", resposta.status);
}

/** POST na API Flask; devolve `data` ou lança `ApiError` com a mensagem do servidor. */
export async function enviar<T>(caminho: string, corpo: unknown, token?: string): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(BASE_URL + caminho, {
      method: "POST",
      headers: montarCabecalhos(token),
      body: JSON.stringify(corpo),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(ERRO_CONEXAO, 0);
  }

  return lerResposta<T>(resposta);
}

/** GET na API Flask; devolve `data` ou lança `ApiError` com a mensagem do servidor. */
export async function buscar<T>(
  caminho: string,
  params: Record<string, string | number> = {},
  token?: string,
): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).map(([chave, valor]) => [chave, String(valor)]),
  );
  const qs = query.toString();
  const url = `${BASE_URL}${caminho}${qs ? `?${qs}` : ""}`;

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: "GET",
      headers: montarCabecalhos(token),
      // O painel atualiza por polling: nunca reaproveitar cache do navegador.
      cache: "no-store",
    });
  } catch {
    throw new ApiError(ERRO_CONEXAO, 0);
  }

  return lerResposta<T>(resposta);
}
