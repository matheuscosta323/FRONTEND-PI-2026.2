/** Corpo de `POST /api/auth`. */
export interface LoginPayload {
  email: string;
  senha: string;
}

/** `data` da resposta de `POST /api/auth`. O campo `usuario` contém o nome. */
export interface LoginResposta {
  usuario: string;
  email: string;
  access_token: string;
}

/** Claims do JWT emitido no login. */
export interface JwtClaims {
  sub: string;
  role: string;
  exp: number;
}

export interface Sessao {
  token: string;
  id: string;
  nome: string;
  email: string;
  role: string;
  /** Instante de expiração, em milissegundos. */
  expiraEm: number;
}
