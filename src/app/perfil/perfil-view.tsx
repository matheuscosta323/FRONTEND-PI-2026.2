"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building,
  Building2,
  Check,
  ChevronRight,
  CircleCheck,
  LayoutGrid,
  LifeBuoy,
  Lock,
  LogOut,
  Map,
  Pencil,
  QrCode,
  SlidersHorizontal,
  Sprout,
  Sun,
  User,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { encerrarSessao } from "@/lib/auth/sessao";
import { APP_NOME, CONFIG } from "@/lib/config";
import { iniciais } from "@/lib/format";
import { rotuloTipo } from "@/lib/usuarios";
import { useSessao } from "@/hooks/use-sessao";

/** Telas já disponíveis. As demais mostram um aviso de "ainda não disponível". */
const ROTAS: Record<string, string> = {
  "visao-geral": "/",
  lotes: "/lotes",
  suporte: `mailto:${CONFIG.emailSuporte}?subject=${encodeURIComponent(`Suporte ${APP_NOME}`)}`,
};

interface ItemMenu {
  rota: string;
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  selo?: { texto: string; classe: string };
}

const GRUPOS_MENU: { titulo: string; itens: ItemMenu[] }[] = [
  {
    titulo: "Conta e acesso",
    itens: [
      { rota: "dados-pessoais", icone: User, titulo: "Dados pessoais", descricao: "Nome, telefone e cargo operacional" },
      { rota: "seguranca", icone: Lock, titulo: "Segurança e senha", descricao: "Biometria facial e 2 etapas", selo: { texto: "Ativa", classe: "bg-emerald-100 text-emerald-800" } },
      { rota: "notificacoes", icone: Bell, titulo: "Notificações e alertas", descricao: "Alertas críticos de geada e umidade", selo: { texto: "Configurado", classe: "bg-gray-100 text-gray-600" } },
    ],
  },
  {
    titulo: "Aplicativo e operação",
    itens: [
      { rota: "preferencias", icone: SlidersHorizontal, titulo: "Preferências do app", descricao: "Unidades (°C, m³/h), tema e cache" },
      { rota: "propriedades", icone: Building2, titulo: "Propriedades e fazendas", descricao: "Fazenda Vale Dourado (sede principal)" },
      { rota: "suporte", icone: LifeBuoy, titulo: "Ajuda e suporte técnico", descricao: "Canal direto com o suporte 24/7" },
    ],
  },
];

const METRICAS: { icone: LucideIcon; valor: string; rotulo: string; classeValor?: string }[] = [
  { icone: LayoutGrid, valor: "12", rotulo: "Lotes ativos" },
  { icone: Zap, valor: "47", rotulo: "Sensores" },
  { icone: CircleCheck, valor: "98,4%", rotulo: "Conformidade", classeValor: "text-brand" },
];

const ABAS: { rota: string; icone: LucideIcon; rotulo: string; ponto?: boolean }[] = [
  { rota: "visao-geral", icone: LayoutGrid, rotulo: "Visão geral" },
  { rota: "lotes", icone: Map, rotulo: "Lotes" },
  { rota: "sensores", icone: Zap, rotulo: "Sensores" },
  { rota: "avisos", icone: Bell, rotulo: "Avisos", ponto: true },
];

interface DadosPerfil {
  nome: string;
  cargo: string;
  telefone: string;
}

function lerPerfil(chave: string, padrao: DadosPerfil): DadosPerfil {
  try {
    return { ...padrao, ...(JSON.parse(localStorage.getItem(chave) ?? "{}") as Partial<DadosPerfil>) };
  } catch {
    return padrao;
  }
}

const CLASSE_ENTRADA =
  "w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";
const CLASSE_CANCELAR =
  "flex-1 cursor-pointer rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50";
const CLASSE_PRIMARIO =
  "flex-1 cursor-pointer rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover";

interface CamadaProps {
  aoFechar: () => void;
  tituloId: string;
  papel?: "dialog" | "alertdialog";
  classe: string;
  children: ReactNode;
}

function Camada({ aoFechar, tituloId, papel = "dialog", classe, children }: CamadaProps) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    raiz.current?.querySelector<HTMLElement>("input, button")?.focus();
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div
      ref={raiz}
      role={papel}
      aria-modal="true"
      aria-labelledby={tituloId}
      className={`absolute inset-0 z-[60] flex bg-black/40 ${classe}`}
      onClick={(evento) => {
        if (evento.target === raiz.current) aoFechar();
      }}
    >
      {children}
    </div>
  );
}

type CamadaAberta = "editar" | "sair" | "qr" | null;

export function PerfilView() {
  const { sessao } = useSessao();
  const router = useRouter();

  const chavePerfil = `agroops:profile:${sessao?.id}`;
  const [perfil, setPerfil] = useState(() =>
    lerPerfil(chavePerfil, {
      nome: sessao?.nome ?? "",
      cargo: rotuloTipo(sessao?.role ?? ""),
      telefone: "",
    }),
  );
  const [camada, setCamada] = useState<CamadaAberta>(null);
  const [rascunho, setRascunho] = useState(perfil);
  const [erroNome, setErroNome] = useState(false);
  const [toast, setToast] = useState({ texto: "", visivel: false });
  const temporizadorToast = useRef<ReturnType<typeof setTimeout>>(undefined);
  const campoNome = useRef<HTMLInputElement>(null);
  const fecharCamada = useCallback(() => setCamada(null), []);

  useEffect(() => () => clearTimeout(temporizadorToast.current), []);

  function mostrarToast(texto: string) {
    setToast({ texto, visivel: true });
    clearTimeout(temporizadorToast.current);
    temporizadorToast.current = setTimeout(() => setToast((t) => ({ ...t, visivel: false })), 2200);
  }

  function abrirEdicao() {
    setRascunho(perfil);
    setErroNome(false);
    setCamada("editar");
  }

  function navegar(rota: string, rotulo: string) {
    if (rota === "dados-pessoais") return abrirEdicao();
    const destino = ROTAS[rota];
    if (!destino) return mostrarToast(`${rotulo}: tela ainda não disponível`);
    if (destino.startsWith("mailto:")) window.location.href = destino;
    else router.push(destino);
  }

  function salvarEdicao(evento: FormEvent) {
    evento.preventDefault();
    const nome = rascunho.nome.trim();
    if (!nome) {
      setErroNome(true);
      campoNome.current?.focus();
      return;
    }
    const novo = { nome, cargo: rascunho.cargo.trim(), telefone: rascunho.telefone.trim() };
    setPerfil(novo);
    try {
      localStorage.setItem(chavePerfil, JSON.stringify(novo));
    } catch {
      /* storage indisponível */
    }
    setCamada(null);
    mostrarToast("Alterações salvas");
  }

  function sair() {
    try {
      localStorage.removeItem(chavePerfil);
    } catch {
      /* storage indisponível */
    }
    encerrarSessao(); // RequireAuth leva para o login
  }

  const siglas = iniciais(perfil.nome);

  return (
    <div className="flex min-h-screen items-center justify-center bg-fundo p-0 text-gray-900 sm:p-4">
      {/* Moldura mobile: tela cheia em celulares; um "aparelho" centralizado em telas grandes. */}
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden border-gray-200 bg-fundo shadow-2xl sm:h-[844px] sm:max-h-[calc(100dvh-2rem)] sm:max-w-[390px] sm:rounded-[40px] sm:border">
        <header className="z-30 shrink-0 border-b border-gray-100/80 bg-white/80 backdrop-blur-md">
          <div className="hidden items-center justify-between px-7 pb-2 pt-3.5 text-xs font-semibold text-gray-800 sm:flex" aria-hidden="true">
            <span>09:41</span>
            <div className="flex items-center gap-1.5 text-gray-700">
              <Wifi className="h-3.5 w-3.5" />
              <div className="flex h-2.5 w-5 items-center rounded-sm border border-gray-700 p-0.5">
                <div className="h-full w-full rounded-[1px] bg-gray-800" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-sm" aria-hidden="true">
                <Sprout className="h-4 w-4" />
              </div>
              <h1 className="text-base font-bold tracking-tight text-gray-900">Perfil</h1>
            </div>
            <button
              type="button"
              aria-label="Abrir avisos"
              onClick={() => navegar("avisos", "Avisos")}
              className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full border border-white bg-red-500" />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 pb-28">
          <section className="flex flex-col items-center rounded-3xl bg-gradient-to-b from-emerald-100/50 via-emerald-50/20 to-transparent p-5 text-center">
            <div className="relative mb-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-emerald-200 text-xl font-bold text-brand shadow-sm">
                {siglas}
              </div>
              <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand text-white" title="Conta verificada">
                <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
              </span>
            </div>
            <h2 className="text-lg font-bold leading-snug text-gray-900">{perfil.nome}</h2>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-xs font-medium text-gray-600">
              <Building className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              <span>{perfil.cargo || "Colaborador"} • Vale Dourado</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">{sessao?.email}</p>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={abrirEdicao}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition-all hover:bg-white active:scale-95"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-600" aria-hidden="true" />
                Editar perfil
              </button>
              <button
                type="button"
                aria-label="Abrir código QR de acesso"
                onClick={() => setCamada("qr")}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200/80 bg-white/90 text-gray-700 shadow-sm transition-all hover:bg-white active:scale-95"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-2.5" aria-label="Resumo da operação">
            {METRICAS.map(({ icone: Icone, valor, rotulo, classeValor }) => (
              <div key={rotulo} className="rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm">
                <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                  <Icone className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <div className={`text-lg font-extrabold leading-tight ${classeValor ?? "text-gray-900"}`}>{valor}</div>
                <div className="text-[11px] font-medium text-gray-500">{rotulo}</div>
              </div>
            ))}
          </section>

          <button
            type="button"
            onClick={() => navegar("telemetria", "Telemetria ao vivo")}
            className="flex w-full cursor-pointer items-center justify-between rounded-2xl bg-brand p-4 text-left text-white shadow-sm transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
                <Sun className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-200/80">Telemetria ao vivo</span>
                <span className="block text-xs font-bold leading-tight">Estação Climatológica 02</span>
                <span className="mt-0.5 block text-[11px] text-emerald-100/70">Sinal excelente • 27,4 °C e 62% UR</span>
              </span>
            </span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-200/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">Online</span>
          </button>

          <div className="space-y-5">
            {GRUPOS_MENU.map((grupo) => (
              <section key={grupo.titulo} className="space-y-1.5">
                <h2 className="px-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">{grupo.titulo}</h2>
                <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {grupo.itens.map(({ rota, icone: Icone, titulo, descricao, selo }) => (
                    <button
                      key={rota}
                      type="button"
                      onClick={() => navegar(rota, titulo)}
                      className="flex w-full cursor-pointer items-center justify-between p-3.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                          <Icone className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span>
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-semibold leading-tight text-gray-900">{titulo}</span>
                            {selo && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${selo.classe}`}>{selo.texto}</span>}
                          </span>
                          <span className="block text-[11px] text-gray-500">{descricao}</span>
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCamada("sair")}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-red-200/80 bg-red-50 py-3 text-xs font-bold text-red-600 transition-all hover:bg-red-100/80 active:bg-red-100"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair da conta
            </button>
          </div>

          <footer className="space-y-0.5 pb-4 pt-2 text-center text-[11px] text-gray-400">
            <p className="font-medium text-gray-500">{APP_NOME} v2.4.1 (Build 182)</p>
            <p>Todos os direitos reservados • {new Date().getFullYear()}</p>
          </footer>
        </main>

        <nav
          aria-label="Navegação principal"
          className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-gray-100 bg-white/95 px-3 pt-2 backdrop-blur-md"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {ABAS.map(({ rota, icone: Icone, rotulo, ponto }) => (
            <button
              key={rota}
              type="button"
              onClick={() => navegar(rota, rotulo)}
              className="flex min-w-[56px] cursor-pointer flex-col items-center gap-0.5 rounded-lg py-1 text-gray-500 transition-colors hover:text-gray-700"
            >
              <span className="relative">
                <Icone className="h-5 w-5" aria-hidden="true" />
                {ponto && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />}
              </span>
              <span className="text-[11px] font-medium">{rotulo}</span>
            </button>
          ))}
          <button type="button" aria-current="page" className="flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg py-1 font-bold text-brand">
            <span className="flex items-center justify-center rounded-full bg-emerald-100 px-3 py-1">
              <span className="text-[10px] font-extrabold tracking-tight text-brand">{siglas}</span>
            </span>
            <span className="text-[11px]">Perfil</span>
          </button>
        </nav>

        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none absolute bottom-24 left-1/2 z-[70] max-w-[85%] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg transition-all duration-200 ${
            toast.visivel ? "opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          {toast.texto}
        </div>

        {camada === "editar" && (
          <Camada aoFechar={fecharCamada} tituloId="editar-titulo" classe="items-end">
            <form onSubmit={salvarEdicao} noValidate className="w-full space-y-4 rounded-t-3xl bg-white p-5 pb-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 id="editar-titulo" className="text-base font-bold text-gray-900">Editar perfil</h2>
                <button type="button" aria-label="Fechar" onClick={fecharCamada} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div>
                <label htmlFor="perfil-nome" className="mb-1.5 block text-xs font-semibold text-gray-600">Nome completo</label>
                <input
                  id="perfil-nome"
                  ref={campoNome}
                  autoComplete="name"
                  value={rascunho.nome}
                  onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
                  aria-invalid={erroNome}
                  className={CLASSE_ENTRADA}
                />
                {erroNome && <p className="mt-1 text-xs font-medium text-red-500">Informe seu nome</p>}
              </div>
              <div>
                <label htmlFor="perfil-cargo" className="mb-1.5 block text-xs font-semibold text-gray-600">Cargo</label>
                <input
                  id="perfil-cargo"
                  value={rascunho.cargo}
                  onChange={(e) => setRascunho({ ...rascunho, cargo: e.target.value })}
                  className={CLASSE_ENTRADA}
                />
              </div>
              <div>
                <label htmlFor="perfil-telefone" className="mb-1.5 block text-xs font-semibold text-gray-600">Telefone</label>
                <input
                  id="perfil-telefone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(81) 99999-9999"
                  value={rascunho.telefone}
                  onChange={(e) => setRascunho({ ...rascunho, telefone: e.target.value })}
                  className={CLASSE_ENTRADA}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={fecharCamada} className={CLASSE_CANCELAR}>Cancelar</button>
                <button type="submit" className={CLASSE_PRIMARIO}>Salvar alterações</button>
              </div>
            </form>
          </Camada>
        )}

        {camada === "sair" && (
          <Camada aoFechar={fecharCamada} tituloId="sair-titulo" papel="alertdialog" classe="items-center justify-center p-6">
            <div className="w-full rounded-3xl bg-white p-6 shadow-2xl">
              <h2 id="sair-titulo" className="mb-1.5 text-base font-bold text-gray-900">Sair da conta?</h2>
              <p className="mb-5 text-sm text-gray-500">Você precisará entrar novamente neste dispositivo.</p>
              <div className="flex gap-2">
                <button type="button" onClick={fecharCamada} className={CLASSE_CANCELAR}>Cancelar</button>
                <button type="button" onClick={sair} className="flex-1 cursor-pointer rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700">Sair</button>
              </div>
            </div>
          </Camada>
        )}

        {camada === "qr" && (
          <Camada aoFechar={fecharCamada} tituloId="qr-titulo" classe="items-center justify-center p-6">
            <div className="w-full rounded-3xl bg-white p-6 text-center shadow-2xl">
              <h2 id="qr-titulo" className="mb-1.5 text-base font-bold text-gray-900">Código de acesso</h2>
              <p className="mb-4 text-sm text-gray-500">Apresente na portaria da fazenda.</p>
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 px-4 text-xs text-gray-400">
                QR code gerado pela API
              </div>
              <button type="button" onClick={fecharCamada} className={`${CLASSE_PRIMARIO} mt-5 w-full`}>Fechar</button>
            </div>
          </Camada>
        )}
      </div>
    </div>
  );
}
