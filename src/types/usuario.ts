/** `Usuario.tipo` é texto livre no banco; estes são os valores oferecidos pelo frontend. */
export type TipoUsuario = "admin" | "colaborador";

/** Corpo de `POST /api/usuarios`. */
export interface CadastroUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
}

/** `data` da resposta de `POST /api/usuarios`. */
export interface UsuarioCadastrado {
  id: number;
  nome: string;
  email: string;
}
