import type { JwtClaims, LoginResposta, Sessao } from "@/types/auth";

const CHAVE = "agroops:sessao";

let sessaoAtual: Sessao | null | undefined; // undefined: ainda não lida do storage
const ouvintes = new Set<() => void>();

function notificar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

function lerStorage(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}

function decodificarClaims(token: string): JwtClaims {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("Token inválido");
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims;
}

/** O login não devolve id nem tipo do usuário; eles vêm das claims do token. */
export function criarSessao(login: LoginResposta): Sessao {
  const claims = decodificarClaims(login.access_token);
  return {
    token: login.access_token,
    id: claims.sub,
    nome: login.usuario,
    email: login.email,
    role: claims.role,
    expiraEm: claims.exp * 1000,
  };
}

export function obterSessao(): Sessao | null {
  if (sessaoAtual === undefined) sessaoAtual = lerStorage();
  if (sessaoAtual && sessaoAtual.expiraEm <= Date.now()) sessaoAtual = null;
  return sessaoAtual;
}

export function salvarSessao(sessao: Sessao) {
  sessaoAtual = sessao;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(sessao));
  } catch {
    /* sem storage, a sessão dura até recarregar a página */
  }
  notificar();
}

export function encerrarSessao() {
  sessaoAtual = null;
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* storage indisponível */
  }
  notificar();
}

function aoMudarStorage(evento: StorageEvent) {
  if (evento.key !== CHAVE && evento.key !== null) return;
  sessaoAtual = undefined;
  notificar();
}

export function assinarSessao(ouvinte: () => void) {
  if (ouvintes.size === 0) window.addEventListener("storage", aoMudarStorage);
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    if (ouvintes.size === 0) window.removeEventListener("storage", aoMudarStorage);
  };
}
