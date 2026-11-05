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

/** POST na API Flask; devolve `data` ou lança `ApiError` com a mensagem do servidor. */
export async function enviar<T>(caminho: string, corpo: unknown, token?: string): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(CONFIG.apiUrl + caminho, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(corpo),
    });
  } catch {
    throw new ApiError(ERRO_CONEXAO, 0);
  }

  const json = (await resposta.json().catch(() => null)) as ApiResposta<T> | JwtFalha | null;

  if (json && "msg" in json) throw new ApiError(ERRO_SESSAO, resposta.status, true);
  if (json && "success" in json) {
    if (json.success) return json.data;
    throw new ApiError(json.message, resposta.status);
  }
  throw new ApiError("Erro interno no servidor.", resposta.status);
}

/** GET no Node-RED. */
export async function buscar<T>(
  caminho: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).map(([chave, valor]) => [chave, String(valor)]),
  );
  const resposta = await fetch(`${CONFIG.noderedUrl}${caminho}?${query}`);
  if (!resposta.ok) {
    throw new ApiError(`Node-RED respondeu ${resposta.status} em ${caminho}`, resposta.status);
  }
  return resposta.json() as Promise<T>;
}
