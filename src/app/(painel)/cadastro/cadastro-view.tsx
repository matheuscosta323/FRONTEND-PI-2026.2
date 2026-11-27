"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, User, UserPlus } from "lucide-react";
import {
  AvisoFormulario,
  BotaoEnviar,
  CampoSelecao,
  CampoSenha,
  CampoTexto,
  type Aviso,
} from "@/components/forms/campos";
import { Topbar } from "@/components/layout/topbar";
import { ApiError } from "@/lib/api/http";
import { cadastrarUsuario } from "@/lib/api/usuarios";
import { encerrarSessao } from "@/lib/auth/sessao";
import { TIPOS_USUARIO } from "@/lib/usuarios";
import {
  SENHA_TAMANHO_MIN,
  TAMANHO_MAX_TEXTO,
  validarCadastro,
  type CadastroValores,
} from "@/lib/validacao";
import { useFormulario } from "@/hooks/use-formulario";
import { useSessao } from "@/hooks/use-sessao";
import type { TipoUsuario } from "@/types/usuario";

const VALORES_INICIAIS: CadastroValores = {
  nome: "",
  email: "",
  tipo: "",
  senha: "",
  confirmacao: "",
};

function CadastroForm({ token }: { token: string }) {
  const { valores, erros, alterar, validarTudo, reiniciar } = useFormulario(
    VALORES_INICIAIS,
    validarCadastro,
  );
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [carregando, setCarregando] = useState(false);

  function alterarCampo<K extends keyof CadastroValores>(campo: K, valor: CadastroValores[K]) {
    alterar(campo, valor);
    setAviso(null);
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setAviso(null);
    if (!validarTudo()) return;

    setCarregando(true);
    try {
      const usuario = await cadastrarUsuario(
        {
          nome: valores.nome.trim(),
          email: valores.email.trim().toLowerCase(),
          senha: valores.senha,
          tipo: valores.tipo as TipoUsuario,
        },
        token,
      );
      reiniciar();
      setAviso({ tipo: "sucesso", texto: `Cadastro de ${usuario.nome} concluído.` });
    } catch (erro) {
      if (erro instanceof ApiError && erro.sessaoInvalida) {
        encerrarSessao();
        return;
      }
      setAviso({
        tipo: "erro",
        texto: erro instanceof ApiError ? erro.message : "Não foi possível cadastrar. Tente novamente.",
      });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} noValidate className="space-y-5">
      <AvisoFormulario aviso={aviso} />

      <CampoTexto
        id="nome"
        rotulo="Nome completo"
        icone={User}
        autoComplete="off"
        maxLength={TAMANHO_MAX_TEXTO}
        placeholder="Nome do usuário"
        value={valores.nome}
        onChange={(e) => alterarCampo("nome", e.target.value)}
        erro={erros.nome}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <CampoTexto
          id="email"
          rotulo="E-mail"
          icone={Mail}
          type="email"
          inputMode="email"
          autoComplete="off"
          maxLength={TAMANHO_MAX_TEXTO}
          placeholder="usuario@email.com"
          value={valores.email}
          onChange={(e) => alterarCampo("email", e.target.value)}
          erro={erros.email}
        />
        <CampoSelecao
          id="tipo"
          rotulo="Tipo de usuário"
          icone={ShieldCheck}
          value={valores.tipo}
          onChange={(e) => alterarCampo("tipo", e.target.value as CadastroValores["tipo"])}
          erro={erros.tipo}
        >
          <option value="" disabled>
            Selecione
          </option>
          {TIPOS_USUARIO.map((tipo) => (
            <option key={tipo.valor} value={tipo.valor}>
              {tipo.rotulo}
            </option>
          ))}
        </CampoSelecao>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <CampoSenha
          id="senha"
          rotulo="Senha"
          autoComplete="new-password"
          placeholder="Crie uma senha"
          dica={`Mínimo de ${SENHA_TAMANHO_MIN} caracteres`}
          value={valores.senha}
          onChange={(e) => alterarCampo("senha", e.target.value)}
          erro={erros.senha}
        />
        <CampoSenha
          id="confirmacao"
          rotulo="Confirmar senha"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={valores.confirmacao}
          onChange={(e) => alterarCampo("confirmacao", e.target.value)}
          erro={erros.confirmacao}
        />
      </div>

      <div className="flex justify-end pt-1">
        <BotaoEnviar carregando={carregando} textoCarregando="Cadastrando..." className="w-full md:w-auto">
          <UserPlus aria-hidden="true" />
          Cadastrar usuário
        </BotaoEnviar>
      </div>
    </form>
  );
}

export function CadastroView() {
  const { sessao } = useSessao();

  return (
    <>
      <Topbar subtitulo="Gestão de acessos" />
      <main className="page">
        <div className="page-head">
          <h2>Cadastrar usuário</h2>
          <Link className="btn-outline" href="/">
            <ArrowLeft aria-hidden="true" />
            Voltar ao dashboard
          </Link>
        </div>

        <section className="card w-full max-w-[760px]">
          {sessao?.role === "admin" ? (
            <>
              <p className="mb-6 text-sm text-texto-suave">
                Crie o acesso de um novo integrante. Depois, passe o e-mail e a senha para a pessoa
                entrar no sistema.
              </p>
              <CadastroForm token={sessao.token} />
            </>
          ) : (
            <p className="empty">Apenas administradores podem cadastrar usuários.</p>
          )}
        </section>
      </main>
    </>
  );
}
