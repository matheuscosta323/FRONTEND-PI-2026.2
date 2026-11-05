"use client";

import { useEffect, useRef } from "react";
import {
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartDataset,
  type ChartOptions,
} from "chart.js";
import { diaCurto, hhmm } from "@/lib/format";
import type { Leitura, LinhaGrafico } from "@/types/monitoramento";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const COR_TEXTO = "#6b746d";
const COR_GRADE = "#eef0ea";

function montarRotulos(leituras: Leitura[]): string[] {
  const primeira = leituras[0];
  const ultima = leituras[leituras.length - 1];
  // Menos de 1 dia de leituras: o eixo X mostra a hora; senão, o dia.
  const mostrarHora =
    !primeira ||
    !ultima ||
    new Date(ultima.data).getTime() - new Date(primeira.data).getTime() < UM_DIA_MS;
  return leituras.map((leitura) => {
    const data = new Date(leitura.data);
    return mostrarHora ? hhmm(data) : diaCurto(data);
  });
}

function montarSeries(leituras: Leitura[], linhas: LinhaGrafico[]): ChartDataset<"line", number[]>[] {
  return linhas.map((linha) => ({
    label: linha.nome,
    data: leituras.map((leitura) => leitura[linha.campo]),
    borderColor: linha.cor,
    yAxisID: linha.campo,
    tension: 0.4,
    borderWidth: 2,
    pointRadius: 0,
  }));
}

function montarEscalas(linhas: LinhaGrafico[], mostrarEixoY: boolean) {
  const escalas: NonNullable<ChartOptions<"line">["scales"]> = {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { maxTicksLimit: 7, maxRotation: 0, color: COR_TEXTO },
    },
  };
  // Cada linha tem sua própria escala vertical.
  for (const linha of linhas) {
    escalas[linha.campo] = {
      display: mostrarEixoY,
      border: { display: false },
      grid: { color: COR_GRADE },
      ticks: { color: COR_TEXTO },
    };
  }
  return escalas;
}

interface GraficoLinhasProps {
  leituras: Leitura[];
  linhas: LinhaGrafico[];
  mostrarEixoY?: boolean;
  rotulo: string;
}

export function GraficoLinhas({ leituras, linhas, mostrarEixoY = false, rotulo }: GraficoLinhasProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const grafico = useRef<Chart<"line", number[], string> | null>(null);

  useEffect(() => {
    if (!canvas.current) return;
    const labels = montarRotulos(leituras);
    const datasets = montarSeries(leituras, linhas);

    // Se o gráfico já existe, só troca os dados.
    if (grafico.current) {
      grafico.current.data.labels = labels;
      grafico.current.data.datasets = datasets;
      grafico.current.update();
      return;
    }

    grafico.current = new Chart<"line", number[], string>(canvas.current, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false } },
        scales: montarEscalas(linhas, mostrarEixoY),
      },
    });
  }, [leituras, linhas, mostrarEixoY]);

  useEffect(
    () => () => {
      grafico.current?.destroy();
      grafico.current = null;
    },
    [],
  );

  return (
    <div className="chart-wrap">
      <canvas ref={canvas} role="img" aria-label={rotulo} />
    </div>
  );
}
