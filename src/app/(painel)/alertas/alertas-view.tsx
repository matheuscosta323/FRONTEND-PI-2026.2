"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Download,
  Droplet,
  FileText,
  MapPin,
  RadioTower,
  Thermometer,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { buscar } from "@/lib/api/http";
import { haMin, num } from "@/lib/format";
import { usePolling } from "@/hooks/use-polling";
import type { BackendLote, BackendRegistro, BackendSensor } from "@/types/monitoramento";

interface ItemAviso {
  id: string;
  tipo: "critico" | "atencao" | "operacional" | "relatorio";
  rotulo: string;
  tempo: string;
  titulo: string;
  descricao: string;
  loteCodigo?: string;
  loteId?: number;
  lido: boolean;
  categoria: "sensores" | "sistema";
}

async function carregarAvisos() {
  const [lotes, sensores, registros] = await Promise.all([
    buscar<BackendLote[]>("/lotes"),
    buscar<BackendSensor[]>("/sensores"),
    buscar<BackendRegistro[]>("/registros"),
  ]);
  return { lotes, sensores, registros };
}

export function AlertasView() {
  const [filtro, setFiltro] = useState<"todos" | "nao_lidos" | "importantes" | "sensores">("todos");
  const [lidos, setLidos] = useState<Set<string>>(new Set(["op-1", "rel-1"]));
  const [feedbackIrrigacao, setFeedbackIrrigacao] = useState<string | null>(null);

  const { dados, atualizadoEm } = usePolling(carregarAvisos);
  const lotes = dados?.lotes ?? [];
  const sensores = dados?.sensores ?? [];
  const registros = dados?.registros ?? [];

  const listaAvisos = useMemo<ItemAviso[]>(() => {
    const itens: ItemAviso[] = [];

    registros.forEach((reg) => {
      const sensor = sensores.find((s) => s.id === reg.sensor_id);
      const lote = sensor ? lotes.find((l) => l.id === sensor.lote_id) : null;
      const loteCodigo = lote ? `LOTE-${String(lote.id).padStart(2, "0")}` : "Lote";
      const minutos = reg.tempo_registro
        ? Math.max(0, Math.round((Date.now() - new Date(reg.tempo_registro).getTime()) / 60000))
        : null;

      if (reg.temperatura_celsius > (lote?.temp_ideal_max ?? 30)) {
        itens.push({
          id: `crit-temp-${reg.id}`,
          tipo: "critico",
          rotulo: "Alerta Crítico",
          tempo: haMin(minutos),
          titulo: `Temperatura Elevada • ${loteCodigo}`,
          descricao: `${sensor?.nome ?? `Sensor ${reg.sensor_id}`} registrou ${num(reg.temperatura_celsius)} °C no solo, acima do limite máximo configurado de ${lote?.temp_ideal_max ?? 30} °C para cultivo de ${lote?.fruta ?? "frutas"}.`,
          loteCodigo,
          loteId: lote?.id,
          lido: false,
          categoria: "sensores",
        });
      }

      if ((reg.umidade_solo ?? 70) < (lote?.umidade_solo_ideal_min ?? 60)) {
        itens.push({
          id: `atenc-umid-${reg.id}`,
          tipo: "atencao",
          rotulo: "Atenção",
          tempo: haMin(minutos),
          titulo: `Umidade Baixa no Solo • ${loteCodigo}`,
          descricao: `Umidade do solo caiu para ${num(reg.umidade_solo ?? 0, 0)}% no ${lote?.fruta ?? "lote"}. Recomendado monitoramento preventivo nas próximas 2 horas.`,
          loteCodigo,
          loteId: lote?.id,
          lido: false,
          categoria: "sensores",
        });
      }
    });

    if (itens.length === 0) {
      itens.push({
        id: "demo-crit-1",
        tipo: "critico",
        rotulo: "Alerta Crítico",
        tempo: "Há 12 min",
        titulo: "Temperatura Elevada • Lote MG-03",
        descricao: "Sensor 02 registrou 32,8 °C no Setor Norte, acima do limite máximo configurado de 30 °C para cultivo de manga Palmer.",
        loteCodigo: "Lote MG-03",
        loteId: 1,
        lido: false,
        categoria: "sensores",
      });
      itens.push({
        id: "demo-atenc-1",
        tipo: "atencao",
        rotulo: "Atenção",
        tempo: "Há 34 min",
        titulo: "Umidade Baixa no Setor Leste",
        descricao: "Umidade do solo caiu para 58% no Lote Vale Dourado. Recomendado monitoramento preventivo nas próximas 2 horas.",
        loteCodigo: "Lote VD-08",
        loteId: 2,
        lido: false,
        categoria: "sensores",
      });
    }

    itens.push({
      id: "op-1",
      tipo: "operacional",
      rotulo: "Operacional",
      tempo: "Ontem às 16:40",
      titulo: "Calibração concluída • Sensor 04",
      descricao: "A manutenção preventiva periódica de sensores de solo foi realizada e os dados foram sincronizados com sucesso pela equipe técnica.",
      lido: true,
      categoria: "sistema",
    });

    itens.push({
      id: "rel-1",
      tipo: "relatorio",
      rotulo: "Relatório",
      tempo: "22 de set",
      titulo: "Relatório semanal consolidado",
      descricao: "O resumo comparativo de temperatura do solo e umidade da safra de manga e uva está disponível para download em PDF e planilha.",
      lido: true,
      categoria: "sistema",
    });

    return itens;
  }, [registros, sensores, lotes]);

  const avisosComStatus = useMemo(() => {
    return listaAvisos.map((aviso) => ({
      ...aviso,
      lido: aviso.lido || lidos.has(aviso.id),
    }));
  }, [listaAvisos, lidos]);

  const contagens = useMemo(() => {
    const todos = avisosComStatus.length;
    const naoLidos = avisosComStatus.filter((a) => !a.lido).length;
    const importantes = avisosComStatus.filter((a) => a.tipo === "critico" || a.tipo === "atencao").length;
    const sensoresCount = avisosComStatus.filter((a) => a.categoria === "sensores").length;
    return { todos, naoLidos, importantes, sensoresCount };
  }, [avisosComStatus]);

  const avisosFiltrados = useMemo(() => {
    if (filtro === "nao_lidos") return avisosComStatus.filter((a) => !a.lido);
    if (filtro === "importantes") return avisosComStatus.filter((a) => a.tipo === "critico" || a.tipo === "atencao");
    if (filtro === "sensores") return avisosComStatus.filter((a) => a.categoria === "sensores");
    return avisosComStatus;
  }, [avisosComStatus, filtro]);

  const avisosHoje = avisosFiltrados.filter((a) => a.tempo.includes("min") || a.tempo.includes("Hoje") || a.tipo === "critico" || a.tipo === "atencao");
  const avisosSemana = avisosFiltrados.filter((a) => !avisosHoje.includes(a));

  function marcarTodosLidos() {
    setLidos(new Set(listaAvisos.map((a) => a.id)));
  }

  function acionarIrrigacao(lote?: string) {
    setFeedbackIrrigacao(`Comando de irrigação enviado para o ${lote ?? "lote"}!`);
    setTimeout(() => setFeedbackIrrigacao(null), 4000);
  }

  return (
    <>
      <Topbar atualizadoEm={atualizadoEm} />
      <main className="page">
        {feedbackIrrigacao && (
          <div className="bg-[#e4f2eb] border border-[#2d6a4f] text-[#2d6a4f] px-[16px] py-[10px] rounded-[10px] text-[13px] flex items-center justify-between">
            <span>{feedbackIrrigacao}</span>
            <button
              type="button"
              className="text-[#2d6a4f] font-semibold text-[12px] underline"
              onClick={() => setFeedbackIrrigacao(null)}
            >
              Fechar
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[24px] font-semibold text-[#191c1c] tracking-[-0.6px]">Avisos</h2>
            <p className="text-[12px] text-[#717973] mt-[2px]">
              {contagens.naoLidos} {contagens.naoLidos === 1 ? "alerta operacional pendente" : "alertas operacionais pendentes"}
            </p>
          </div>

          <button
            type="button"
            onClick={marcarTodosLidos}
            className="flex items-center gap-[6px] px-[14px] py-[6px] rounded-full text-[13px] font-semibold text-[#1b4332] bg-[rgba(174,238,203,0.4)] hover:bg-[rgba(174,238,203,0.6)] transition-colors"
          >
            <Check className="w-[14px] h-[14px]" aria-hidden="true" />
            Marcar lidos
          </button>
        </div>

        <div className="flex items-center gap-[8px] overflow-x-auto py-[2px]">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`flex items-center gap-[6px] px-[14px] py-[6px] rounded-full text-[13px] font-semibold transition-all ${
              filtro === "todos"
                ? "bg-[#1b4332] text-white shadow-sm"
                : "bg-white text-[#414844] border border-[#dde4de] hover:bg-[#f4f6f1]"
            }`}
          >
            <span>Todos</span>
            <span
              className={`text-[11px] px-[6px] py-px rounded-full ${
                filtro === "todos" ? "bg-white/20 text-white" : "bg-[#f4f6f1] text-[#717973]"
              }`}
            >
              {contagens.todos}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro("nao_lidos")}
            className={`flex items-center gap-[6px] px-[14px] py-[6px] rounded-full text-[13px] font-medium transition-all ${
              filtro === "nao_lidos"
                ? "bg-[#1b4332] text-white shadow-sm font-semibold"
                : "bg-white text-[#414844] border border-[#dde4de] hover:bg-[#f4f6f1]"
            }`}
          >
            <span className="w-[8px] h-[8px] rounded-full bg-[#2c694e]" />
            <span>Não lidos</span>
            <span className="text-[11px] text-[#717973] ml-px">{contagens.naoLidos}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro("importantes")}
            className={`flex items-center gap-[6px] px-[14px] py-[6px] rounded-full text-[13px] font-medium transition-all ${
              filtro === "importantes"
                ? "bg-[#1b4332] text-white shadow-sm font-semibold"
                : "bg-white text-[#414844] border border-[#dde4de] hover:bg-[#f4f6f1]"
            }`}
          >
            <span className="w-[8px] h-[8px] rounded-full bg-[#ba1a1a]" />
            <span>Importantes</span>
            <span className="text-[11px] text-[#717973] ml-px">{contagens.importantes}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro("sensores")}
            className={`flex items-center gap-[6px] px-[14px] py-[6px] rounded-full text-[13px] font-medium transition-all ${
              filtro === "sensores"
                ? "bg-[#1b4332] text-white shadow-sm font-semibold"
                : "bg-white text-[#414844] border border-[#dde4de] hover:bg-[#f4f6f1]"
            }`}
          >
            <RadioTower className="w-[13px] h-[13px] text-[#414844]" />
            <span>Sensores</span>
            <span className="text-[11px] text-[#717973] ml-px">{contagens.sensoresCount}</span>
          </button>
        </div>

        <section className="flex flex-col gap-[12px] pt-[8px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.55px] text-[#717973]">HOJE</span>
            <span className="text-[11px] font-medium text-[#2c694e]">Sincronizado recentemente</span>
          </div>

          {avisosHoje.length === 0 ? (
            <div className="card p-[20px] text-center text-[#717973] text-[13px]">
              Nenhum aviso pendente para hoje.
            </div>
          ) : (
            avisosHoje.map((aviso) => {
              if (aviso.tipo === "critico") {
                return (
                  <div
                    key={aviso.id}
                    className="relative bg-[rgba(255,218,214,0.3)] border border-[#ffdad6] rounded-[16px] p-[16px] flex flex-col gap-[12px] shadow-sm overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#ba1a1a] rounded-r-full" />

                    <div className="flex items-start justify-between pl-[4px]">
                      <div className="flex items-center gap-[8px]">
                        <span className="inline-flex items-center gap-[4px] px-[8px] py-[2px] rounded-full bg-[#ba1a1a] text-white text-[11px] font-semibold">
                          <span className="w-[6px] h-[6px] rounded-full bg-white" />
                          {aviso.rotulo}
                        </span>
                        <span className="text-[12px] text-[#717973]">{aviso.tempo}</span>
                      </div>
                      <div className="w-[10px] h-[10px] rounded-full bg-[#ba1a1a] shadow-[0_0_0_4px_#ffdad6]" />
                    </div>

                    <div className="flex flex-col gap-[4px] pl-[4px]">
                      <div className="flex items-center gap-[6px]">
                        <Thermometer className="w-[15px] h-[15px] text-[#ba1a1a]" />
                        <h3 className="text-[16px] font-semibold text-[#191c1c] tracking-[-0.4px]">
                          {aviso.titulo}
                        </h3>
                      </div>
                      <p className="text-[12px] text-[#414844] leading-[16px]">{aviso.descricao}</p>
                    </div>

                    <div className="flex items-center gap-[8px] pl-[4px] pt-[2px]">
                      <button
                        type="button"
                        onClick={() => acionarIrrigacao(aviso.loteCodigo)}
                        className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[12px] bg-[#012d1d] hover:bg-[#14402f] text-white text-[13px] font-semibold shadow-sm transition-colors"
                      >
                        <Droplet className="w-[13px] h-[13px]" />
                        Acionar irrigação
                      </button>
                      <Link
                        href={aviso.loteId ? `/lotes/${aviso.loteId}` : "/lotes"}
                        className="flex items-center gap-[4px] px-[12px] py-[6px] rounded-[12px] bg-white border border-[#dde4de] hover:bg-[#f4f6f1] text-[#191c1c] text-[13px] font-medium shadow-sm transition-colors"
                      >
                        <MapPin className="w-[13px] h-[13px] text-[#717973]" />
                        Ver no mapa
                      </Link>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={aviso.id}
                  className="bg-white border border-[#dde4de] rounded-[16px] p-[16px] flex flex-col gap-[10px] shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-[8px]">
                      <span className="inline-flex items-center gap-[4px] px-[10px] py-[2px] rounded-full bg-[#ffdcc4] text-[#6f3800] text-[11px] font-semibold">
                        <span className="w-[6px] h-[6px] rounded-full bg-[#5f2f00]" />
                        {aviso.rotulo}
                      </span>
                      <span className="text-[12px] text-[#717973]">{aviso.tempo}</span>
                    </div>
                    <div className="w-[10px] h-[10px] rounded-full bg-[#2c694e] shadow-[0_0_0_4px_rgba(174,238,203,0.4)]" />
                  </div>

                  <div className="flex flex-col gap-[4px]">
                    <div className="flex items-center gap-[6px]">
                      <TriangleAlert className="w-[15px] h-[15px] text-[#b7791f]" />
                      <h3 className="text-[16px] font-semibold text-[#191c1c] tracking-[-0.4px]">
                        {aviso.titulo}
                      </h3>
                    </div>
                    <p className="text-[12px] text-[#414844] leading-[16px]">{aviso.descricao}</p>
                  </div>

                  <div className="flex items-center justify-between pt-[4px]">
                    <span className="text-[11px] font-semibold tracking-[0.44px] text-[#717973]">
                      {aviso.loteCodigo ?? "Monitoramento"}
                    </span>
                    <Link
                      href={aviso.loteId ? `/lotes/${aviso.loteId}` : "/relatorio"}
                      className="flex items-center gap-[2px] text-[13px] font-semibold text-[#2c694e] hover:underline"
                    >
                      Detalhes
                      <ChevronRight className="w-[14px] h-[14px]" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="flex flex-col gap-[12px] pt-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.55px] text-[#717973]">ESTA SEMANA</span>
            <span className="text-[11px] font-medium text-[#717973]">Histórico</span>
          </div>

          {avisosSemana.length === 0 ? (
            <div className="card p-[20px] text-center text-[#717973] text-[13px]">
              Nenhum registro no histórico desta semana.
            </div>
          ) : (
            avisosSemana.map((aviso) => {
              if (aviso.tipo === "operacional") {
                return (
                  <div
                    key={aviso.id}
                    className="bg-white/80 border border-[#dde4de] rounded-[16px] p-[16px] flex flex-col gap-[10px] shadow-sm opacity-90"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-[8px]">
                        <span className="inline-flex items-center gap-[4px] px-[10px] py-[2px] rounded-full bg-[#b1f0ce] text-[#0e5138] text-[11px] font-semibold">
                          <span className="w-[6px] h-[6px] rounded-full bg-[#2c694e]" />
                          Operacional
                        </span>
                        <span className="text-[12px] text-[#717973]">{aviso.tempo}</span>
                      </div>
                      <Check className="w-[16px] h-[16px] text-[#2c694e]" />
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <div className="flex items-center gap-[6px]">
                        <Wrench className="w-[15px] h-[15px] text-[#2c694e]" />
                        <h3 className="text-[16px] font-semibold text-[#191c1c] tracking-[-0.4px]">
                          {aviso.titulo}
                        </h3>
                      </div>
                      <p className="text-[12px] text-[#414844] leading-[16px]">{aviso.descricao}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={aviso.id}
                  className="bg-white/80 border border-[#dde4de] rounded-[16px] p-[16px] flex flex-col gap-[10px] shadow-sm opacity-90"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-[8px]">
                      <span className="inline-flex items-center gap-[4px] px-[10px] py-[2px] rounded-full bg-[#e1e3e2] text-[#414844] text-[11px] font-semibold">
                        <FileText className="w-[11px] h-[11px]" />
                        Relatório
                      </span>
                      <span className="text-[12px] text-[#717973]">{aviso.tempo}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-[4px]">
                    <h3 className="text-[16px] font-semibold text-[#191c1c] tracking-[-0.4px]">
                      {aviso.titulo}
                    </h3>
                    <p className="text-[12px] text-[#414844] leading-[16px]">{aviso.descricao}</p>
                  </div>

                  <div className="flex items-center justify-between pt-[4px]">
                    <span className="text-[11px] font-semibold tracking-[0.44px] text-[#717973]">
                      Documento • 2.4 MB
                    </span>
                    <Link
                      href="/relatorio"
                      className="flex items-center gap-[4px] text-[13px] font-semibold text-[#012d1d] hover:underline"
                    >
                      Ver relatório
                      <Download className="w-[12px] h-[12px]" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}
