"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { ChevronDown, Eye, EyeOff, LoaderCircle, Lock, type LucideIcon } from "lucide-react";

const CLASSE_ENTRADA =
  "w-full rounded-xl bg-transparent py-3.5 pl-11 text-sm text-texto placeholder:text-gray-400 focus:outline-none";

interface MolduraProps {
  id: string;
  rotulo: string;
  icone: LucideIcon;
  erro?: string;
  dica?: string;
  children: ReactNode;
}

function Moldura({ id, rotulo, icone: Icone, erro, dica, children }: MolduraProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-texto-suave"
      >
        {rotulo}
      </label>
      <div
        className={`relative rounded-xl border bg-white transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10 ${
          erro ? "border-erro" : "border-borda"
        }`}
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
          <Icone aria-hidden="true" />
        </span>
        {children}
      </div>
      {erro ? (
        <p id={`${id}-erro`} className="mt-1.5 pl-1 text-xs font-medium text-erro">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${id}-dica`} className="mt-1.5 pl-1 text-xs text-texto-suave">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

function descricao(id: string, erro?: string, dica?: string) {
  if (erro) return `${id}-erro`;
  return dica ? `${id}-dica` : undefined;
}

type CampoTextoProps = ComponentProps<"input"> & {
  id: string;
  rotulo: string;
  icone: LucideIcon;
  erro?: string;
  dica?: string;
};

export function CampoTexto({ id, rotulo, icone, erro, dica, ...props }: CampoTextoProps) {
  return (
    <Moldura id={id} rotulo={rotulo} icone={icone} erro={erro} dica={dica}>
      <input
        id={id}
        name={id}
        aria-invalid={Boolean(erro)}
        aria-describedby={descricao(id, erro, dica)}
        className={`${CLASSE_ENTRADA} pr-4`}
        {...props}
      />
    </Moldura>
  );
}

type CampoSenhaProps = Omit<ComponentProps<"input">, "type"> & {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
};

export function CampoSenha({ id, rotulo, erro, dica, ...props }: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false);
  const Icone = visivel ? Eye : EyeOff;

  return (
    <Moldura id={id} rotulo={rotulo} icone={Lock} erro={erro} dica={dica}>
      <input
        id={id}
        name={id}
        type={visivel ? "text" : "password"}
        aria-invalid={Boolean(erro)}
        aria-describedby={descricao(id, erro, dica)}
        className={`${CLASSE_ENTRADA} pr-12`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisivel(!visivel)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
        className="absolute inset-y-0 right-0 flex cursor-pointer items-center rounded-r-xl px-3.5 text-gray-400 transition-colors hover:text-gray-600"
      >
        <Icone aria-hidden="true" />
      </button>
    </Moldura>
  );
}

type CampoSelecaoProps = ComponentProps<"select"> & {
  id: string;
  rotulo: string;
  icone: LucideIcon;
  erro?: string;
};

export function CampoSelecao({ id, rotulo, icone, erro, children, ...props }: CampoSelecaoProps) {
  return (
    <Moldura id={id} rotulo={rotulo} icone={icone} erro={erro}>
      <select
        id={id}
        name={id}
        aria-invalid={Boolean(erro)}
        aria-describedby={descricao(id, erro)}
        className={`${CLASSE_ENTRADA} cursor-pointer appearance-none border-0 pr-10`}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
        <ChevronDown aria-hidden="true" />
      </span>
    </Moldura>
  );
}

interface BotaoEnviarProps {
  carregando: boolean;
  textoCarregando: string;
  children: ReactNode;
  className?: string;
}

export function BotaoEnviar({ carregando, textoCarregando, children, className = "" }: BotaoEnviarProps) {
  return (
    <button
      type="submit"
      disabled={carregando}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80 ${className}`}
    >
      {carregando ? (
        <>
          {textoCarregando}
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </button>
  );
}

export interface Aviso {
  tipo: "erro" | "sucesso";
  texto: string;
}

export function AvisoFormulario({ aviso }: { aviso: Aviso | null }) {
  if (!aviso) return null;
  const cores =
    aviso.tipo === "erro"
      ? "border-erro/25 bg-erro-bg text-erro"
      : "border-ok/25 bg-ok-bg text-ok";
  return (
    <div
      role={aviso.tipo === "erro" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${cores}`}
    >
      {aviso.texto}
    </div>
  );
}
