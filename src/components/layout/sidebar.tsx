"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  LayoutGrid,
  Map,
  RadioTower,
  Sprout,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { APP_NOME } from "@/lib/config";
import { iniciais } from "@/lib/format";
import { rotuloTipo } from "@/lib/usuarios";
import { useSessao } from "@/hooks/use-sessao";
import { useAlertas } from "@/components/layout/alertas-provider";

interface ItemMenu {
  href: string;
  icone: LucideIcon;
  nome: string;
}

const MONITORAMENTO: ItemMenu[] = [
  { href: "/", icone: LayoutGrid, nome: "Visão geral" },
  { href: "/lotes", icone: Map, nome: "Lotes" },
  { href: "/sensores", icone: RadioTower, nome: "Sensores" },
  { href: "/alertas", icone: Bell, nome: "Alertas" },
];

const GESTAO: ItemMenu[] = [
  { href: "/propriedades", icone: Building2, nome: "Propriedades" },
  { href: "/equipe", icone: Users, nome: "Equipe" },
];

const CADASTRO: ItemMenu = { href: "/cadastro", icone: UserPlus, nome: "Cadastrar usuário" };

export function Sidebar() {
  const pathname = usePathname();
  const { sessao } = useSessao();
  const qtdAlertas = useAlertas()?.length ?? 0;

  const gestao = sessao?.role === "admin" ? [...GESTAO, CADASTRO] : GESTAO;

  function renderItem({ href, icone: Icone, nome }: ItemMenu) {
    const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className={ativo ? "nav-item is-active" : "nav-item"}
        aria-current={ativo ? "page" : undefined}
      >
        <Icone aria-hidden="true" />
        {nome}
        {href === "/alertas" && qtdAlertas > 0 && <span className="badge-count">{qtdAlertas}</span>}
      </Link>
    );
  }

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-logo">
          <Sprout aria-hidden="true" />
        </span>
        {APP_NOME}
      </Link>
      <nav className="nav">
        {MONITORAMENTO.map(renderItem)}
        <p className="nav-group">Gestão</p>
        {gestao.map(renderItem)}
      </nav>
      {sessao && (
        <Link className="user" href="/perfil">
          <span className="avatar">{iniciais(sessao.nome)}</span>
          <span>
            <strong>{sessao.nome}</strong>
            <small>{rotuloTipo(sessao.role)}</small>
          </span>
        </Link>
      )}
    </aside>
  );
}
