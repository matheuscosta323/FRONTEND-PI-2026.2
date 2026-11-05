/** Envelope devolvido pelos controllers da API Flask. */
export interface ApiSucesso<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFalha {
  success: false;
  message: string;
}

export type ApiResposta<T> = ApiSucesso<T> | ApiFalha;

/** Formato dos erros gerados pelo Flask-JWT-Extended (token ausente, inválido ou expirado). */
export interface JwtFalha {
  msg: string;
}
