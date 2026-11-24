"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  CircleCheck,
  Download,
  Droplets,
  Thermometer,
  TriangleAlert,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GraficoLinhas } from "@/components/monitoramento/grafico-linhas";
import { buscar } from "@/lib/api/http";
import { num } from "@/lib/format";
import { usePolling } from "@/hooks/use-polling";
import type {
  BackendLote,
  BackendRegistro,
  BackendSensor,
  Leitura,
  LinhaGrafico,
} from "@/types/monitoramento";

const LINHAS: LinhaGrafico[] = [
  { campo: "temperatura", nome: "Temperatura do solo (°C)", cor: "#b8964f" },
  { campo: "umidade", nome: "Umidade do solo (%)", cor: "#4f86a0" },
];

async function carregarRelatorio() {
  const [lotes, sensores, registros] = await Promise.all([
    buscar<BackendLote[]>("/lotes"),
    buscar<BackendSensor[]>("/sensores"),
    buscar<BackendRegistro[]>("/registros"),
  ]);
  return { lotes, sensores, registros };
}

function formatarIntervalo(dias: number): string {
  const fim = new Date();
  const inicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  return `${inicio.getDate()} a ${fim.getDate()} de ${meses[fim.getMonth()]} de ${fim.getFullYear()}`;
}

function formatarDataHora(dataIso?: string | null): { data: string; hora: string } {
  if (!dataIso) return { data: "--", hora: "--" };
  const d = new Date(dataIso);
  const hoje = new Date();
  const ehHoje = d.toDateString() === hoje.toDateString();
  const data = ehHoje ? "Hoje" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { data, hora };
}

export function RelatorioView() {
  const [dias, setDias] = useState<number>(7);
  const [loteId, setLoteId] = useState<string>("todos");
  const { dados, erro, atualizadoEm } = usePolling(carregarRelatorio);

  const lotes = dados?.lotes ?? [];
  const sensores = dados?.sensores ?? [];
  const registros = dados?.registros ?? [];

  const loteAtivo = useMemo(() => {
    if (loteId === "todos") return null;
    return lotes.find((l) => String(l.id) === loteId) ?? null;
  }, [lotes, loteId]);

  const sensoresFiltrados = useMemo(() => {
    if (!loteAtivo) return sensores;
    return sensores.filter((s) => s.lote_id === loteAtivo.id);
  }, [sensores, loteAtivo]);

  const sensorIdsSet = useMemo(() => {
    return new Set(sensoresFiltrados.map((s) => s.id));
  }, [sensoresFiltrados]);

  const { leiturasAtuais, registrosAtuais, leiturasAnteriores } = useMemo(() => {
    const agora = Date.now();
    const inicioAtual = agora - dias * 24 * 60 * 60 * 1000;
    const inicioAnterior = agora - dias * 2 * 24 * 60 * 60 * 1000;

    const filtradosSensor = registros.filter((r) => sensorIdsSet.has(r.sensor_id));

    const atuais = filtradosSensor
      .filter((r) => {
        const t = r.tempo_registro ? new Date(r.tempo_registro).getTime() : 0;
        return t >= inicioAtual;
      })
      .sort((a, b) => (a.tempo_registro ?? "").localeCompare(b.tempo_registro ?? ""));

    const anteriores = filtradosSensor.filter((r) => {
      const t = r.tempo_registro ? new Date(r.tempo_registro).getTime() : 0;
      return t >= inicioAnterior && t < inicioAtual;
    });

    const mapLeituras = (regs: BackendRegistro[]): Leitura[] =>
      regs.map((r) => ({
        data: r.tempo_registro ?? new Date().toISOString(),
        temperatura: r.temperatura_celsius,
        umidade: r.umidade_solo ?? r.umidade_ar ?? 0,
      }));

    return {
      leiturasAtuais: mapLeituras(atuais),
      registrosAtuais: atuais,
      leiturasAnteriores: mapLeituras(anteriores),
    };
  }, [registros, sensorIdsSet, dias]);

  const metricas = useMemo(() => {
    const total = leiturasAtuais.length;
    if (total === 0) {
      return {
        mediaTemp: null,
        minTemp: null,
        maxTemp: null,
        mediaUmid: null,
        minUmid: null,
        maxUmid: null,
        taxaIdeal: 100,
        qtdIdeal: 0,
        qtdAlertas: 0,
        diffTemp: 0,
        diffUmid: 0,
      };
    }

    const temps = leiturasAtuais.map((l) => l.temperatura);
    const umids = leiturasAtuais.map((l) => l.umidade);

    const somaTemp = temps.reduce((acc, t) => acc + t, 0);
    const somaUmid = umids.reduce((acc, u) => acc + u, 0);

    const mediaTemp = somaTemp / total;
    const mediaUmid = somaUmid / total;

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const minUmid = Math.min(...umids);
    const maxUmid = Math.max(...umids);

    const tempMinIdeal = loteAtivo?.temp_ideal_min ?? 20;
    const tempMaxIdeal = loteAtivo?.temp_ideal_max ?? 28;
    const umidMinIdeal = loteAtivo?.umidade_solo_ideal_min ?? 60;
    const umidMaxIdeal = loteAtivo?.umidade_solo_ideal_max ?? 80;

    const ideais = leiturasAtuais.filter(
      (l) =>
        l.temperatura >= tempMinIdeal &&
        l.temperatura <= tempMaxIdeal &&
        l.umidade >= umidMinIdeal &&
        l.umidade <= umidMaxIdeal,
    );

    const taxaIdeal = Math.round((ideais.length / total) * 100);
    const qtdAlertas = total - ideais.length;

    let diffTemp = 0;
    let diffUmid = 0;
    if (leiturasAnteriores.length > 0) {
      const somaAntTemp = leiturasAnteriores.reduce((acc, l) => acc + l.temperatura, 0);
      const somaAntUmid = leiturasAnteriores.reduce((acc, l) => acc + l.umidade, 0);
      const medAntTemp = somaAntTemp / leiturasAnteriores.length;
      const medAntUmid = somaAntUmid / leiturasAnteriores.length;
      diffTemp = mediaTemp - medAntTemp;
      diffUmid = mediaUmid - medAntUmid;
    }

    return {
      mediaTemp,
      minTemp,
      maxTemp,
      mediaUmid,
      minUmid,
      maxUmid,
      taxaIdeal,
      qtdIdeal: ideais.length,
      qtdAlertas,
      diffTemp,
      diffUmid,
    };
  }, [leiturasAtuais, leiturasAnteriores, loteAtivo]);

  function exportarCsv() {
    const cabecalho = ["Data", "Hora", "Sensor", "Temperatura do Solo (C)", "Umidade do Solo (%)", "Status"];
    const linhas = registrosAtuais.map((r) => {
      const { data, hora } = formatarDataHora(r.tempo_registro);
      const sensor = sensores.find((s) => s.id === r.sensor_id);
      const nomeSensor = sensor ? sensor.nome : `Sensor ${r.sensor_id}`;
      return [
        `"${data}"`,
        `"${hora}"`,
        `"${nomeSensor}"`,
        num(r.temperatura_celsius),
        num(r.umidade_solo ?? 0, 0),
        `"${r.status === "ok" ? "Dentro da faixa" : "Alerta"}"`,
      ].join(";");
    });

    const conteudo = [cabecalho.join(";"), ...linhas].join("\n");
    const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-condicoes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const ultimosRegistros = useMemo(() => {
    return [...registrosAtuais].reverse().slice(0, 8);
  }, [registrosAtuais]);

  return (
    <>
      <Topbar
        titulo="Relatório de condições"
        atualizadoEm={atualizadoEm}
        subtitulo={`Atualizado hoje, às ${atualizadoEm ? atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}`}
      />
      <main className="page">
        <section className="flex flex-col gap-[18px]">
          <div className="page-head">
            <div>
              <h2>Condições ao longo do tempo</h2>
            </div>
            <div className="botoes">
              <Link className="btn-outline" href="/">
                <ArrowLeft aria-hidden="true" />
                Voltar ao dashboard
              </Link>
              <button
                type="button"
                className="btn-outline"
                style={{ background: "#e6f0eb", color: "#2e6b57", borderColor: "transparent" }}
                onClick={exportarCsv}
              >
                <Download aria-hidden="true" />
                Exportar relatório
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-[14px]">
            <div className="flex flex-col gap-[6px] w-[180px]">
              <label htmlFor="periodo-select" className="text-[10px] font-medium uppercase text-[#98a39d]">
                Período
              </label>
              <select
                id="periodo-select"
                value={dias}
                onChange={(e) => setDias(Number(e.target.value))}
                className="h-[38px] px-[12px] rounded-[8px] border border-[#dde4de] bg-white text-[12px] text-[#17251f]"
              >
                <option value={1}>Último dia</option>
                <option value={3}>Últimos 3 dias</option>
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
              </select>
            </div>

            <div className="flex flex-col gap-[6px] w-[220px]">
              <label htmlFor="lote-select" className="text-[10px] font-medium uppercase text-[#98a39d]">
                Lote
              </label>
              <select
                id="lote-select"
                value={loteId}
                onChange={(e) => setLoteId(e.target.value)}
                className="h-[38px] px-[12px] rounded-[8px] border border-[#dde4de] bg-white text-[12px] text-[#17251f]"
              >
                <option value="todos">Todos os lotes</option>
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fruta ? l.fruta.charAt(0).toUpperCase() + l.fruta.slice(1) : `Lote ${l.id}`} · LOTE-{String(l.id).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>

            <div className="pb-[4px] text-[11px] text-[#68766f]">
              {formatarIntervalo(dias)}
            </div>
          </div>
        </section>

        <section className="kpis quatro" aria-label="Resumo do período">
          <div className="card flex flex-col justify-between gap-[10px] p-[18px]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#68766f]">Temperatura média</span>
              <span className="w-[30px] h-[30px] rounded-[6px] bg-[#fbf0dd] grid place-items-center text-[#b8964f]">
                <Thermometer className="w-[16px] h-[16px]" aria-hidden="true" />
              </span>
            </div>
            <div className="flex items-baseline gap-[8px]">
              <strong className="text-[28px] font-normal text-[#17251f] leading-none">
                {metricas.mediaTemp != null ? `${num(metricas.mediaTemp)} °C` : "--"}
              </strong>
              <div className="flex flex-col text-[10px]">
                <span className="text-[#98a39d]">
                  {metricas.minTemp != null ? `mín. ${num(metricas.minTemp)} · máx. ${num(metricas.maxTemp)}` : "--"}
                </span>
                <span className="text-[#317657] font-semibold">
                  {metricas.diffTemp < 0
                    ? `↓ ${num(Math.abs(metricas.diffTemp))} °C vs. período anterior`
                    : metricas.diffTemp > 0
                    ? `↑ ${num(metricas.diffTemp)} °C vs. período anterior`
                    : "estável vs. período anterior"}
                </span>
              </div>
            </div>
          </div>

          <div className="card flex flex-col justify-between gap-[10px] p-[18px]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#68766f]">Umidade média do solo</span>
              <span className="w-[30px] h-[30px] rounded-[6px] bg-[#e8f0f3] grid place-items-center text-[#4f86a0]">
                <Droplets className="w-[16px] h-[16px]" aria-hidden="true" />
              </span>
            </div>
            <div className="flex items-baseline gap-[8px]">
              <strong className="text-[28px] font-normal text-[#17251f] leading-none">
                {metricas.mediaUmid != null ? `${num(metricas.mediaUmid, 0)}%` : "--"}
              </strong>
              <div className="flex flex-col text-[10px]">
                <span className="text-[#98a39d]">
                  {metricas.minUmid != null ? `mín. ${num(metricas.minUmid, 0)} · máx. ${num(metricas.maxUmid, 0)}%` : "--"}
                </span>
                <span className="text-[#317657] font-semibold">
                  {metricas.diffUmid > 0
                    ? `↑ ${num(metricas.diffUmid, 0)} p.p. vs. período anterior`
                    : metricas.diffUmid < 0
                    ? `↓ ${num(Math.abs(metricas.diffUmid), 0)} p.p. vs. período anterior`
                    : "estável vs. período anterior"}
                </span>
              </div>
            </div>
          </div>

          <div className="card flex flex-col justify-between gap-[10px] p-[18px]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#68766f]">Tempo na faixa ideal</span>
              <span className="w-[30px] h-[30px] rounded-[6px] bg-[#e4f2eb] grid place-items-center text-[#317657]">
                <CircleCheck className="w-[16px] h-[16px]" aria-hidden="true" />
              </span>
            </div>
            <div className="flex items-baseline gap-[8px]">
              <strong className="text-[28px] font-normal text-[#17251f] leading-none">
                {metricas.taxaIdeal}%
              </strong>
              <div className="flex flex-col text-[10px]">
                <span className="text-[#98a39d]">
                  {metricas.qtdIdeal} de {leiturasAtuais.length} leituras
                </span>
                <span className="text-[#317657] font-semibold">
                  dentro da faixa ideal
                </span>
              </div>
            </div>
          </div>

          <div className="card flex flex-col justify-between gap-[10px] p-[18px]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#68766f]">Eventos no período</span>
              <span className="w-[30px] h-[30px] rounded-[6px] bg-[#f9e7e5] grid place-items-center text-[#b64b42]">
                <TriangleAlert className="w-[16px] h-[16px]" aria-hidden="true" />
              </span>
            </div>
            <div className="flex items-baseline gap-[8px]">
              <strong className="text-[28px] font-normal text-[#17251f] leading-none">
                {metricas.qtdAlertas}
              </strong>
              <div className="flex flex-col text-[10px]">
                <span className="text-[#98a39d]">
                  {metricas.qtdAlertas === 0 ? "tudo em ordem" : `${metricas.qtdAlertas} alerta(s)`}
                </span>
                <span className="text-[#68766f] font-semibold">
                  {metricas.qtdAlertas === 0 ? "condições estáveis" : "requer monitoramento"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="card flex flex-col gap-[16px]">
          <div className="card-head">
            <div>
              <h2>Evolução horária das condições</h2>
              <p className="text-[11px] text-[#68766f] mt-[2px]">
                Médias consolidadas dos sensores de solo do {loteAtivo ? loteAtivo.fruta : "lote"}
              </p>
            </div>
            <div className="legend">
              <span>
                <i className="dot dot-temp" />
                Temperatura do solo
              </span>
              <span>
                <i className="dot dot-umid" />
                Umidade do solo
              </span>
              <span>
                <span className="inline-block w-[14px] h-[2px] mr-[6px] bg-[#98a39d]" />
                Período anterior
              </span>
              <span className="inline-flex items-center gap-[4px]">
                <span className="inline-block w-[14px] h-[8px] rounded-[2px] bg-[#e6f0eb]" />
                Faixa ideal
              </span>
            </div>
          </div>

          <div style={{ height: 280 }}>
            {leiturasAtuais.length === 0 ? (
              <p className="empty">Nenhum registro encontrado para o período selecionado.</p>
            ) : (
              <GraficoLinhas
                leituras={leiturasAtuais}
                linhas={LINHAS}
                rotulo="Evolução horária da temperatura e umidade do solo"
                mostrarEixoY
              />
            )}
          </div>
          <p className="text-[10px] text-[#98a39d]">
            Leituras dos sensores de solo a cada 15 minutos · linhas exibem médias horárias · limites configurados por lote
          </p>
        </section>

        <section className="relatorio-grid-duas">
          <div className="card flex flex-col gap-[14px]">
            <div className="flex items-center justify-between">
              <h2>Comparação com o período anterior</h2>
              <span className="text-[10px] text-[#98a39d]">período anterior ({dias}d)</span>
            </div>

            <div className="flex items-center justify-between p-[12px] bg-[#f8faf7] rounded-[8px]">
              <div className="flex items-center gap-[8px]">
                <span className="w-[7px] h-[7px] rounded-full bg-[#b8964f]" />
                <span className="text-[12px] text-[#68766f]">Temperatura média do solo</span>
              </div>
              <div className="flex items-center gap-[16px]">
                <strong className="text-[13px] text-[#17251f]">
                  {metricas.mediaTemp != null ? `${num(metricas.mediaTemp)} °C` : "--"}
                </strong>
                <span className="text-[11px] text-[#98a39d] w-[50px] text-right">
                  {leiturasAnteriores.length > 0
                    ? `${num(leiturasAnteriores.reduce((a, b) => a + b.temperatura, 0) / leiturasAnteriores.length)} °C`
                    : "--"}
                </span>
                <span className="text-[11px] font-semibold text-[#317657] w-[60px] text-right">
                  {metricas.diffTemp !== 0 ? `${metricas.diffTemp > 0 ? "+" : ""}${num(metricas.diffTemp)} °C` : "0,0 °C"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-[12px] bg-[#f8faf7] rounded-[8px]">
              <div className="flex items-center gap-[8px]">
                <span className="w-[7px] h-[7px] rounded-full bg-[#4f86a0]" />
                <span className="text-[12px] text-[#68766f]">Umidade média do solo</span>
              </div>
              <div className="flex items-center gap-[16px]">
                <strong className="text-[13px] text-[#17251f]">
                  {metricas.mediaUmid != null ? `${num(metricas.mediaUmid, 0)}%` : "--"}
                </strong>
                <span className="text-[11px] text-[#98a39d] w-[50px] text-right">
                  {leiturasAnteriores.length > 0
                    ? `${num(leiturasAnteriores.reduce((a, b) => a + b.umidade, 0) / leiturasAnteriores.length, 0)}%`
                    : "--"}
                </span>
                <span className="text-[11px] font-semibold text-[#317657] w-[60px] text-right">
                  {metricas.diffUmid !== 0 ? `${metricas.diffUmid > 0 ? "+" : ""}${num(metricas.diffUmid, 0)} p.p.` : "0 p.p."}
                </span>
              </div>
            </div>
          </div>

          <div className="card flex flex-col gap-[14px]">
            <div className="flex items-center justify-between">
              <h2>Faixas ideais e limites</h2>
              <span className="px-[8px] py-[3px] rounded-full bg-[#e4f2eb] text-[#317657] text-[10px] font-semibold">
                {metricas.taxaIdeal}% ideal
              </span>
            </div>

            <div className="flex items-center gap-[12px] p-[10px] rounded-[8px]">
              <span className="w-[34px] h-[34px] rounded-[6px] bg-[#fbf0dd] grid place-items-center text-[#b8964f]">
                <Thermometer className="w-[17px] h-[17px]" />
              </span>
              <div className="flex-1">
                <small className="block text-[11px] text-[#68766f]">Temperatura do solo</small>
                <strong className="text-[13px] text-[#17251f]">
                  {loteAtivo ? `${num(loteAtivo.temp_ideal_min, 0)}–${num(loteAtivo.temp_ideal_max, 0)} °C` : "20–28 °C"}
                </strong>
              </div>
              <span className="text-[10px] text-[#98a39d] text-right">alerta acima de 30 °C</span>
            </div>

            <div className="flex items-center gap-[12px] p-[10px] rounded-[8px]">
              <span className="w-[34px] h-[34px] rounded-[6px] bg-[#e8f0f3] grid place-items-center text-[#4f86a0]">
                <Droplets className="w-[17px] h-[17px]" />
              </span>
              <div className="flex-1">
                <small className="block text-[11px] text-[#68766f]">Umidade do solo</small>
                <strong className="text-[13px] text-[#17251f]">
                  {loteAtivo ? `${num(loteAtivo.umidade_solo_ideal_min ?? 60, 0)}–${num(loteAtivo.umidade_solo_ideal_max ?? 80, 0)}%` : "60–80%"}
                </strong>
              </div>
              <span className="text-[10px] text-[#98a39d] text-right">alerta abaixo de 55%</span>
            </div>
          </div>
        </section>

        <section className="card flex flex-col gap-[16px]">
          <div className="card-head">
            <h2>Registros recentes</h2>
            <button
              type="button"
              className="btn-outline"
              onClick={exportarCsv}
              aria-label="Baixar registros recentes em CSV"
            >
              Baixar CSV
              <Download aria-hidden="true" />
            </button>
          </div>

          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Data e hora</th>
                  <th>Sensor</th>
                  <th>Temperatura do solo</th>
                  <th>Umidade do solo</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ultimosRegistros.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  ultimosRegistros.map((reg) => {
                    const { data, hora } = formatarDataHora(reg.tempo_registro);
                    const sensor = sensores.find((s) => s.id === reg.sensor_id);
                    const nomeSensor = sensor ? sensor.nome : `Sensor ${reg.sensor_id}`;
                    const lote = sensor ? lotes.find((l) => l.id === sensor.lote_id) : null;
                    const setor = lote ? `Lote ${lote.id} (${lote.fruta})` : "Setor Monitorado";
                    const statusOk = reg.status === "ok";

                    return (
                      <tr key={reg.id}>
                        <td>
                          <strong>{data}</strong>
                          <small>{hora}</small>
                        </td>
                        <td>
                          <strong>{nomeSensor}</strong>
                          <small>{setor}</small>
                        </td>
                        <td>{num(reg.temperatura_celsius)} °C</td>
                        <td>{num(reg.umidade_solo ?? 0, 0)}%</td>
                        <td>
                          <span className={`status ${statusOk ? "status-saudavel" : "status-atencao"}`}>
                            {statusOk ? "Dentro da faixa" : "Alerta de oscilação"}
                          </span>
                        </td>
                        <td className="seta">
                          <ChevronRight aria-hidden="true" className="w-[15px] h-[15px]" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
