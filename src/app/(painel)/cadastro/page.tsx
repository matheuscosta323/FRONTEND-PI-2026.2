import type { Metadata } from "next";
import { CadastroView } from "./cadastro-view";

export const metadata: Metadata = { title: "Cadastrar usuário" };

export default function CadastroPage() {
  return <CadastroView />;
}
