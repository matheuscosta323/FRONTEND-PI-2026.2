import { enviar } from "@/lib/api/http";
import type { LoginPayload, LoginResposta } from "@/types/auth";

export function autenticar(payload: LoginPayload): Promise<LoginResposta> {
  return enviar<LoginResposta>("/auth", payload);
}
