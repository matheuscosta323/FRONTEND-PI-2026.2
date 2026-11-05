import type { TipoUsuario } from "@/types/usuario";
import type { ErrosDe } from "@/hooks/use-formulario";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Limite das colunas `nome` e `email` da tabela `usuario`. */
export const TAMANHO_MAX_TEXTO = 180;
export const SENHA_TAMANHO_MIN = 8;

export function emailValido(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export interface LoginValores {
  email: string;
  senha: string;
}

export function validarLogin(v: LoginValores): ErrosDe<LoginValores> {
  const erros: ErrosDe<LoginValores> = {};
  if (!emailValido(v.email)) erros.email = "Informe um e-mail válido";
  if (!v.senha) erros.senha = "Digite sua senha para prosseguir";
  return erros;
}

export interface CadastroValores {
  nome: string;
  email: string;
  tipo: TipoUsuario | "";
  senha: string;
  confirmacao: string;
}

export function validarCadastro(v: CadastroValores): ErrosDe<CadastroValores> {
  const erros: ErrosDe<CadastroValores> = {};
  if (!v.nome.trim()) erros.nome = "Informe o nome completo";
  if (!emailValido(v.email)) erros.email = "Informe um e-mail válido";
  if (!v.tipo) erros.tipo = "Selecione o tipo de usuário";
  if (v.senha.length < SENHA_TAMANHO_MIN) {
    erros.senha = `Use pelo menos ${SENHA_TAMANHO_MIN} caracteres`;
  } else if (v.senha !== v.senha.trim()) {
    // O cadastro da API remove esses espaços, mas o login não: a senha digitada nunca confere.
    erros.senha = "A senha não pode começar nem terminar com espaço";
  }
  if (v.confirmacao !== v.senha) erros.confirmacao = "As senhas não coincidem";
  return erros;
}
