import { enviar } from "@/lib/api/http";
import type { CadastroUsuarioPayload, UsuarioCadastrado } from "@/types/usuario";

/** Exige o token de um usuário `admin`. */
export function cadastrarUsuario(
  payload: CadastroUsuarioPayload,
  token: string,
): Promise<UsuarioCadastrado> {
  return enviar<UsuarioCadastrado>("/usuarios", payload, token);
}
