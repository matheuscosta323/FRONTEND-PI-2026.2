"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Droplets, Thermometer, ThermometerSun } from "lucide-react";
import { useAlertas } from "@/components/layout/alertas-provider";
import { Topbar } from "@/components/layout/topbar";
import { GraficoLinhas } from "@/components/monitoramento/grafico-linhas";
import { KpiCard } from "@/components/monitoramento/kpi-card";
import { LinhasLotes } from "@/components/monitoramento/tabela-lotes";
import { buscarLeituras, buscarResumo } from "@/lib/api/nodered";
import { CONFIG } from "@/lib/config";
import { haMin, num } from "@/lib/format";
import { usePolling } from "@/hooks/use-polling";
import type { Leitura, LinhaGrafico } from "@/types/monitoramento";

const LINHAS: LinhaGrafico[] = [
  { campo: "temperatura", nome: "Temperatura (°C)", cor: "#b8964f" },
  { campo: "umidade", nome: "Umidade do ar (%)", cor: "#4f86a0" },
];

async function buscarDashboard() {
  const [leituras, dados] = await Promise.all([buscarLeituras(), buscarResumo()]);
  return { leituras, dados };
}

function temperaturaMedia(leituras: Leitura[]): string {
  if (leituras.length === 0) return "--";
  const soma = leituras.reduce((total, leitura) => total + leitura.temperatura, 0);
  return num(soma / leituras.length) + " °C";
}

function umidadeRecente(leituras: Leitura[]): string {
  const ultima = leituras[leituras.length - 1];
  return ultima ? num(ultima.umidade, 0) + "%" : "--";
}

export function DashboardView() {
  const { dados, erro, atualizadoEm } = usePolling(buscarDashboard);
  const alertas = useAlertas() ?? [];
  const resumo = dados?.dados.resumo;
  const leituras = dados?.leituras ?? [];

  return (
    <>
      <Topbar atualizadoEm={atualizadoEm} />
      <main className="page">
        <section className="kpis" aria-label="Resumo">
          {resumo && (
            <>
              <KpiCard
                rotulo="Lotes monitorados"
                valor={resumo.lotes}
                nota={`${resumo.uva} uva · ${resumo.manga} manga`}
              />
              <KpiCard
                rotulo="Sensores ativos"
                valor={resumo.sensoresAtivos}
                nota={`de ${resumo.sensoresTotal} instalados`}
              />
              <KpiCard
                rotulo="Alertas abertos"
                valor={alertas.length}
                nota={alertas.length > 0 ? `${alertas.length} requer atenção` : "tudo em ordem"}
              />
            </>
          )}
        </section>

        <section className="card chart-card">
          <div className="card-head">
            <h2>Condições ao longo do tempo</h2>
            <Link className="btn-outline" href="/relatorio">
              Ver relatório
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="chart-body">
            <div>
              <div className="legend">
                <span>
                  <i className="dot dot-temp" />
                  Temperatura
                </span>
                <span>
                  <i className="dot dot-umid" />
                  Umidade do ar
                </span>
              </div>
              <GraficoLinhas
                leituras={leituras}
                linhas={LINHAS}
                rotulo="Temperatura e umidade do ar ao longo do tempo"
              />
            </div>
            <div className="side-stats">
              {erro && !dados ? (
                <p className="empty">
                  Não foi possível falar com o Node-RED. Verifique se ele está rodando em{" "}
                  {CONFIG.noderedUrl}.
                </p>
              ) : (
                <>
                  <div className="stat">
                    <span className="stat-icon temp">
                      <Thermometer aria-hidden="true" />
                    </span>
                    <div>
                      <small>Temperatura</small>
                      <strong>{temperaturaMedia(leituras)}</strong>
                      <small>média observada</small>
                    </div>
                  </div>
                  <div className="stat">
                    <span className="stat-icon umid">
                      <Droplets aria-hidden="true" />
                    </span>
                    <div>
                      <small>Umidade do ar</small>
                      <strong>{umidadeRecente(leituras)}</strong>
                      <small>leitura recente</small>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="bottom">
          <section className="card">
            <div className="card-head">
              <h2>Lotes monitorados</h2>
              <Link className="btn-outline" href="/lotes">
                Ver todos
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Fruta</th>
                    <th>Status</th>
                    <th>Última leitura</th>
                  </tr>
                </thead>
                <tbody>
                  <LinhasLotes lotes={dados?.dados.lotes ?? []} />
                </tbody>
              </table>
            </div>
          </section>

          <section className="card alerts-card">
            <h2>Alertas recentes</h2>
            <div className="alerts-list">
              {alertas.map((alerta, indice) => (
                <Link className="alert-item" href="/alertas" key={`${alerta.titulo}-${indice}`}>
                  <span className="stat-icon">
                    <ThermometerSun aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{alerta.titulo}</strong>
                    <small>{alerta.local}</small>
                    <small>{haMin(alerta.minutosAtras)}</small>
                  </div>
                  <ChevronRight aria-hidden="true" />
                </Link>
              ))}
              {alertas.length === 0 && <p className="empty">Nenhum alerta aberto no momento.</p>}
            </div>
            <Link className="btn-soft" href="/alertas">
              Abrir central de alertas
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
