"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CircleHelp, Mail, Sprout } from "lucide-react";
import {
  AvisoFormulario,
  BotaoEnviar,
  CampoSenha,
  CampoTexto,
  type Aviso,
} from "@/components/forms/campos";
import { autenticar } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { criarSessao, salvarSessao } from "@/lib/auth/sessao";
import { APP_NOME, CONFIG } from "@/lib/config";
import { validarLogin, type LoginValores } from "@/lib/validacao";
import { useFormulario } from "@/hooks/use-formulario";
import { useSessao } from "@/hooks/use-sessao";

const CHAVE_EMAIL_LEMBRADO = "agroops:remembered-email";

function lerEmailLembrado(): string {
  try {
    return localStorage.getItem(CHAVE_EMAIL_LEMBRADO) ?? "";
  } catch {
    return "";
  }
}

/** Guarda só o e-mail, nunca a senha. */
function gravarEmailLembrado(email: string | null) {
  try {
    if (email) localStorage.setItem(CHAVE_EMAIL_LEMBRADO, email);
    else localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
  } catch {
    /* storage indisponível */
  }
}

/** Aceita só caminhos internos, para `?next=` não redirecionar a outro site. */
function destinoSeguro(next: string | null): string {
  return next && /^\/(?![/\\])/.test(next) ? next : "/";
}

function LoginForm() {
  const [emailLembrado] = useState(lerEmailLembrado);
  const { valores, erros, alterar, validarTudo } = useFormulario<LoginValores>(
    { email: emailLembrado, senha: "" },
    validarLogin,
  );
  const [lembrar, setLembrar] = useState(Boolean(emailLembrado));
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [carregando, setCarregando] = useState(false);

  function alterarCampo(campo: keyof LoginValores, valor: string) {
    alterar(campo, valor);
    setAviso(null);
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setAviso(null);
    if (!validarTudo()) return;

    // O cadastro grava o e-mail em minúsculas; o login da API compara como recebe.
    const email = valores.email.trim().toLowerCase();
    setCarregando(true);
    try {
      const resposta = await autenticar({ email, senha: valores.senha });
      gravarEmailLembrado(lembrar ? email : null);
      salvarSessao(criarSessao(resposta)); // a tela redireciona ao detectar a sessão
    } catch (erro) {
      setCarregando(false);
      setAviso({
        tipo: "erro",
        texto: erro instanceof ApiError ? erro.message : "Não foi possível entrar. Tente novamente.",
      });
    }
  }

  return (
    <form onSubmit={aoEnviar} noValidate className="space-y-5">
      <AvisoFormulario aviso={aviso} />

      <CampoTexto
        id="email"
        rotulo="E-mail"
        icone={Mail}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="seu@email.com"
        value={valores.email}
        onChange={(e) => alterarCampo("email", e.target.value)}
        erro={erros.email}
      />

      <CampoSenha
        id="senha"
        rotulo="Senha"
        autoComplete="current-password"
        placeholder="Digite sua senha"
        value={valores.senha}
        onChange={(e) => alterarCampo("senha", e.target.value)}
        erro={erros.senha}
      />

      <div className="flex items-center justify-between gap-3 pt-1">
        <label className="flex cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            checked={lembrar}
            onChange={(e) => setLembrar(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          <span className="text-sm text-texto-suave">Lembrar meu e-mail</span>
        </label>
        <a
          href={`mailto:${CONFIG.emailSuporte}?subject=${encodeURIComponent("Recuperação de senha")}`}
          className="text-sm font-semibold text-texto transition-colors hover:text-brand-focus"
        >
          Esqueci minha senha
        </a>
      </div>

      <BotaoEnviar carregando={carregando} textoCarregando="Acessando..." className="w-full">
        Entrar
        <ArrowRight aria-hidden="true" />
      </BotaoEnviar>

      <div className="border-t border-borda pt-6 text-center">
        <a
          href={`mailto:${CONFIG.emailSuporte}?subject=${encodeURIComponent("Ajuda com o login")}`}
          className="inline-flex items-center gap-1.5 text-xs text-texto-suave transition-colors hover:text-texto"
        >
          <CircleHelp className="h-4 w-4" aria-hidden="true" />
          Precisa de ajuda? Fale com o suporte.
        </a>
      </div>
    </form>
  );
}

export function LoginView() {
  const { status } = useSessao();
  const router = useRouter();
  const destino = destinoSeguro(useSearchParams().get("next"));

  useEffect(() => {
    if (status === "autenticado") router.replace(destino);
  }, [status, destino, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex justify-end px-4 py-6 sm:px-8">
        <p className="text-sm text-texto-suave">
          Primeira vez por aqui?
          <a
            href={`mailto:${CONFIG.emailGestao}?subject=${encodeURIComponent(`Solicitação de acesso ao ${APP_NOME}`)}`}
            className="ml-1 font-semibold text-texto transition-colors hover:text-brand-focus"
          >
            Fale com a sua gestão
          </a>
        </p>
      </header>

      <main className="flex w-full flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-[460px] rounded-[2rem] border border-borda bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 md:p-12">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2.5 text-lg font-semibold text-texto">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-brand-hover text-white">
                <Sprout aria-hidden="true" />
              </span>
              {APP_NOME}
            </div>
            <h1 className="mb-2.5 text-3xl font-bold tracking-tight">Boas-vindas de volta</h1>
            <p className="text-sm text-texto-suave">Entre com seus dados para acompanhar sua operação.</p>
          </div>
          {/* O formulário lê o storage ao montar: só aparece depois da hidratação. */}
          {status === "anonimo" && <LoginForm />}
        </div>
      </main>
    </div>
  );
}
