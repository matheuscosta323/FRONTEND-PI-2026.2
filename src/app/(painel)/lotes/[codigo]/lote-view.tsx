"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Map, TriangleAlert } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GraficoLinhas } from "@/components/monitoramento/grafico-linhas";
import { KpiCard } from "@/components/monitoramento/kpi-card";
import { ApiError } from "@/lib/api/http";
import { buscarLote } from "@/lib/api/nodered";
import { CONFIG } from "@/lib/config";
import { haMin, num } from "@/lib/format";
import { usePolling } from "@/hooks/use-polling";
import type { Leitura, LinhaGrafico } from "@/types/monitoramento";

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const PERIODOS = [
  { dias: 1, rotulo: "Último dia" },
  { dias: 3, rotulo: "Últimos 3 dias" },
  { dias: 7, rotulo: "Últimos 7 dias" },
];

interface BlocoGraficoProps {
  leituras: Leitura[];
  /** Momento da última atualização, usado como referência do período. */
  referencia: number;
  linha: LinhaGrafico;
  titulo: string;
  classeLegenda: string;
}

function BlocoGrafico({ leituras, referencia, linha, titulo, classeLegenda }: BlocoGraficoProps) {
  const [dias, setDias] = useState(7);
  const recentes = useMemo(() => {
    const desde = referencia - dias * UM_DIA_MS;
    return leituras.filter((leitura) => new Date(leitura.data).getTime() >= desde);
  }, [leituras, referencia, dias]);
  const linhas = useMemo(() => [linha], [linha]);

  return (
    <div className="grafico-bloco">
      <div className="grafico-topo">
        <span>
          <i className={`dot ${classeLegenda}`} />
          {titulo}
        </span>
        <select
          aria-label={`Período de ${titulo.toLowerCase()}`}
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
        >
          {PERIODOS.map((periodo) => (
            <option key={periodo.dias} value={periodo.dias}>
              {periodo.rotulo}
            </option>
          ))}
        </select>
      </div>
      <GraficoLinhas leituras={recentes} linhas={linhas} mostrarEixoY rotulo={titulo} />
    </div>
  );
}

const LINHA_UMIDADE: LinhaGrafico = { campo: "umidade", nome: "Umidade do ar (%)", cor: "#4f86a0" };
const LINHA_TEMPERATURA: LinhaGrafico = { campo: "temperatura", nome: "Temperatura (°C)", cor: "#b8964f" };

export function LoteView({ codigo }: { codigo: string }) {
  const buscarDetalhe = useCallback(() => buscarLote(codigo), [codigo]);
  const { dados, erro, atualizadoEm } = usePolling(buscarDetalhe);
  const referencia = atualizadoEm?.getTime() ?? 0;
  const leituras = dados?.leituras ?? [];
  const telefone = CONFIG.telefoneTransportadora;

  let titulo = <>Lote</>;
  if (dados) {
    titulo = (
      <>
        Lote{" "}
        <span>
          {dados.lote.codigo} - {dados.lote.nome}
        </span>
      </>
    );
  } else if (erro) {
    titulo =
      erro instanceof ApiError && erro.status === 404 ? (
        <>Lote não encontrado</>
      ) : (
        <>Não foi possível carregar o lote</>
      );
  }

  return (
    <>
      <Topbar atualizadoEm={atualizadoEm} />
      <main className="page">
        <div className="page-head">
          <h2>{titulo}</h2>
          <div className="botoes">
            <Link className="btn-outline" href="/">
              <LayoutGrid aria-hidden="true" />
              Voltar ao dashboard
            </Link>
            <Link className="btn-outline" href="/lotes">
              <Map aria-hidden="true" />
              Voltar para os lotes
            </Link>
          </div>
        </div>

        <section className="kpis duas">
          {dados && (
            <>
              <KpiCard
                rotulo="Temperatura média do lote"
                valor={dados.mediaTemperatura != null ? num(dados.mediaTemperatura) + "°C" : "--"}
              />
              <KpiCard
                rotulo="Umidade média do lote"
                valor={dados.mediaUmidade != null ? num(dados.mediaUmidade, 0) + "%" : "--"}
              />
            </>
          )}
        </section>

        <div className="lote-grid">
          <section className="card">
            {dados && leituras.length === 0 && (
              <p className="empty">Este lote ainda não tem sensor conectado.</p>
            )}
            <BlocoGrafico
              leituras={leituras}
              referencia={referencia}
              linha={LINHA_UMIDADE}
              titulo="Umidade do ar"
              classeLegenda="dot-umid"
            />
            <BlocoGrafico
              leituras={leituras}
              referencia={referencia}
              linha={LINHA_TEMPERATURA}
              titulo="Temperatura"
              classeLegenda="dot-temp"
            />
          </section>

          <section className="card alerts-card">
            <h2>Alertas do lote</h2>
            <div className="alerts-list">
              {dados?.alertas.map((alerta, indice) => (
                <div className="alert-item" key={`${alerta.titulo}-${indice}`}>
                  <span className="stat-icon">
                    <TriangleAlert aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{alerta.titulo}</strong>
                    <small>{alerta.detalhe}</small>
                    <small>{haMin(alerta.minutosAtras)}</small>
                  </div>
                  <span className={`status status-${alerta.nivel}`}>
                    {alerta.nivel === "critico" ? "Crítico" : "Atenção"}
                  </span>
                </div>
              ))}
              {dados?.alertas.length === 0 && <p className="empty">Nenhum alerta neste lote.</p>}
            </div>
            <a
              className={telefone ? "btn-soft" : "btn-soft desativado"}
              href={telefone ? `tel:${telefone}` : undefined}
            >
              Ligar para a Transportadora
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
