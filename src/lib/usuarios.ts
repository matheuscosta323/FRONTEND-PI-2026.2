import type { TipoUsuario } from "@/types/usuario";

export const TIPOS_USUARIO: { valor: TipoUsuario; rotulo: string }[] = [
  { valor: "colaborador", rotulo: "Colaborador" },
  { valor: "admin", rotulo: "Administrador" },
];

export function rotuloTipo(tipo: string): string {
  return TIPOS_USUARIO.find((t) => t.valor === tipo)?.rotulo ?? "Colaborador";
}
